import ServiceEditor from "../../ServiceEditor";
import prisma from "@/lib/prisma";

export default async function EditServicePage({ params: rawParams }) {
  // Rename original params to rawParams
  const actualParams = await rawParams; // Await the promise to get the actual params object
  const { serviceId } = actualParams; // Destructure serviceId from the unwrapped object

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: { featuredImage: true },
  });

  if (!service) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Error</h1>
        <p className="mt-4 text-sm text-red-600">Service not found.</p>
      </div>
    );
  }

  const siteId = service.siteId;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Edit Service</h1>
        <p className="text-sm text-slate-500 mt-1">Editing: {service.title}</p>
      </div>
      <div className="bg-white shadow rounded p-6">
        <ServiceEditor siteId={siteId} service={service} />
      </div>
    </div>
  );
}
