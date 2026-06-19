import { BaseService } from "@/core/service";
import { settingsRepository } from "@/repositories/settings.repository";
import { ValidationError } from "@/core/errors";
import { CtaConfigSchema } from "@/lib/validators/cta";
import { EventBus } from "@/core/events";
import { logAction } from "@/lib/audit";

export class SettingsService extends BaseService {
  constructor() {
    super(settingsRepository);
  }

  async getSettingsField(siteId, fieldName) {
    const settings = await settingsRepository.findBySiteId(siteId);
    return settings?.[fieldName] || null;
  }

  async updateSettingsField(siteId, fieldName, data, userId = null) {
    // Validate if it is ctaConfig
    if (fieldName === "ctaConfig" && data) {
      const parsed = CtaConfigSchema.safeParse(data);
      if (!parsed.success) {
        throw new ValidationError(parsed.error.errors);
      }
      data = parsed.data;
    }

    const updated = await settingsRepository.upsertSettings(siteId, {
      [fieldName]: data
    });

    if (userId) {
      try {
        await logAction(siteId, userId, `SETTINGS_${fieldName.toUpperCase()}_UPDATE`, {
          siteId
        });
      } catch (err) {
        console.error(`Audit log failed for setting ${fieldName} update:`, err);
      }
    }

    EventBus.emit("settings.updated", { siteId, userId, fieldName, data: updated });

    return updated[fieldName];
  }

  async updateGlobalSettings(siteId, data, userId = null) {
    // Validate CTA config if provided
    if (data.ctaConfig) {
      const parsed = CtaConfigSchema.safeParse(data.ctaConfig);
      if (!parsed.success) {
        throw new ValidationError(parsed.error.errors);
      }
      data.ctaConfig = parsed.data;
    }

    const updatePayload = {
      header: data.header !== undefined ? data.header : undefined,
      footer: data.footer !== undefined ? data.footer : undefined,
      analytics: data.analytics !== undefined ? data.analytics : undefined,
      scripts: data.scripts !== undefined ? data.scripts : undefined,
      ctaConfig: data.ctaConfig !== undefined ? data.ctaConfig : undefined,
    };

    // Filter undefined keys
    Object.keys(updatePayload).forEach(key => {
      if (updatePayload[key] === undefined) {
        delete updatePayload[key];
      }
    });

    const result = await settingsRepository.upsertSettings(siteId, updatePayload);

    if (userId) {
      try {
        await logAction(siteId, userId, "GLOBAL_SETTINGS_UPDATED", { siteId });
      } catch (err) {
        console.error("Audit log failed for global settings update:", err);
      }
    }

    EventBus.emit("settings.global.updated", { siteId, userId, data: result });

    return result;
  }
}

export const settingsService = new SettingsService();
