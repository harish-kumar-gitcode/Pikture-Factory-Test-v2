// Import every Mongoose model once so populate(ref: ...) works reliably in
// Next.js route handlers, where individual route module graphs can otherwise
// leave referenced models unregistered during development/hot reloads.
import '@/models/Admin';
import '@/models/Client';
import '@/models/DriveIntegration';
import '@/models/Enquiry';
import '@/models/GalleryItem';
import '@/models/Lead';
import '@/models/MediaDownload';
import '@/models/Project';
import '@/models/ProjectMedia';
import '@/models/Ticket';
import '@/models/Vendor';
import '@/models/VendorOnboardingRequest';
import '@/models/PhotographyPackage';
