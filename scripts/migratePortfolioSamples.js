/**
 * One-time backfill: turns portfolioSamples already sitting on APPROVED vendor
 * records into real GalleryItem entries (status: pending) so they show up in the
 * admin Gallery Approval queue, the "View Vendor Gallery" screen, and — once
 * approved — the public site. New approvals do this automatically; this script
 * is only needed to fix vendors that were approved before that change shipped.
 *
 * Run with: node scripts/migratePortfolioSamples.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI missing in .env');

  await mongoose.connect(uri);

  const VendorSchema = new mongoose.Schema({}, { strict: false });
  const Vendor = mongoose.models.Vendor || mongoose.model('Vendor', VendorSchema);

  const GalleryItemSchema = new mongoose.Schema({}, { strict: false });
  const GalleryItem = mongoose.models.GalleryItem || mongoose.model('GalleryItem', GalleryItemSchema);

  const vendors = await Vendor.find({ status: 'approved', 'portfolioSamples.0': { $exists: true } });
  let created = 0;

  for (const vendor of vendors) {
    const existing = await GalleryItem.find({
      vendor: vendor._id,
      publicId: { $in: (vendor.portfolioSamples || []).map((s) => s.publicId) },
    }).select('publicId');
    const already = new Set(existing.map((e) => e.publicId));

    const toCreate = (vendor.portfolioSamples || [])
      .filter((s) => s.publicId && !already.has(s.publicId))
      .map((s) => ({
        url: s.url,
        publicId: s.publicId,
        type: s.type || 'image',
        vendor: vendor._id,
        vendorCode: vendor.vendorCode,
        project: null,
        status: 'pending',
      }));

    if (toCreate.length) {
      await GalleryItem.insertMany(toCreate);
      created += toCreate.length;
      console.log(`+ ${toCreate.length} sample(s) migrated for ${vendor.firstName} ${vendor.lastName} (${vendor.vendorCode})`);
    }
  }

  console.log(`\n✅ Done — ${created} gallery item(s) created across ${vendors.length} vendor(s) checked.`);
  console.log('They are all set to "pending" — review them from Admin → Gallery Approval or Admin → Vendor Gallery.');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
