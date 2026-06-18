"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ServiceEditor({ siteId, service }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    ctaButtonText: "",
    ctaButtonLink: "",
    sortOrder: 0,
    status: "DRAFT",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isEditMode = !!service;

  useEffect(() => {
    if (isEditMode) {
      setFormData({
        title: service.title || "",
        description: service.description || "",
        price: service.price || "",
        ctaButtonText: service.ctaButtonText || "",
        ctaButtonLink: service.ctaButtonLink || "",
        sortOrder: service.sortOrder || 0,
        status: service.status || "DRAFT",
      });
    }
  }, [service, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const serviceData = { ...formData, siteId };

    const url = isEditMode
      ? `/api/admin/services/${service.id}`
      : "/api/admin/services";
    const method = isEditMode ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(serviceData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save service");
      }

      router.push("/services");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-md">
          <p>
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            Service Title
          </label>
          <input
            type="text"
            name="title"
            id="title"
            value={formData.title}
            onChange={handleChange}
            className="mt-1 block w-full input"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Description
          </label>
          <textarea
            name="description"
            id="description"
            value={formData.description}
            onChange={handleChange}
            rows={5}
            className="mt-1 block w-full input"
          />
        </div>

        <div>
          <label
            htmlFor="price"
            className="block text-sm font-medium text-gray-700"
          >
            Price
          </label>
          <input
            type="text"
            name="price"
            id="price"
            value={formData.price}
            onChange={handleChange}
            className="mt-1 block w-full input"
            placeholder="e.g., $500 or Contact for Quote"
          />
        </div>

        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700"
          >
            Status
          </label>
          <select
            name="status"
            id="status"
            value={formData.status}
            onChange={handleChange}
            className="mt-1 block w-full input bg-white"
          >
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="ctaButtonText"
            className="block text-sm font-medium text-gray-700"
          >
            CTA Button Text
          </label>
          <input
            type="text"
            name="ctaButtonText"
            id="ctaButtonText"
            value={formData.ctaButtonText}
            onChange={handleChange}
            className="mt-1 block w-full input"
            placeholder="e.g., Learn More"
          />
        </div>

        <div>
          <label
            htmlFor="ctaButtonLink"
            className="block text-sm font-medium text-gray-700"
          >
            CTA Button Link
          </label>
          <input
            type="text"
            name="ctaButtonLink"
            id="ctaButtonLink"
            value={formData.ctaButtonLink}
            onChange={handleChange}
            className="mt-1 block w-full input"
            placeholder="e.g., /contact-us"
          />
        </div>

        <div>
          <label
            htmlFor="sortOrder"
            className="block text-sm font-medium text-gray-700"
          >
            Sort Order
          </label>
          <input
            type="number"
            name="sortOrder"
            id="sortOrder"
            value={formData.sortOrder}
            onChange={handleChange}
            className="mt-1 block w-full input"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => router.push("/services")}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
        >
          {isSubmitting
            ? "Saving..."
            : isEditMode
              ? "Update Service"
              : "Create Service"}
        </button>
      </div>
    </form>
  );
}

// Add a generic .input class to your globals.css if you don't have one
// .input { @apply px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500; }
