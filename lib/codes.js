/** Human-readable sequential codes for clients and vendors. */
import mongoose from 'mongoose';

const SequenceSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, required: true },
    value: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Sequence = mongoose.models.Sequence || mongoose.model('Sequence', SequenceSchema);

async function nextSequentialCode({ key, prefix, Model, field }) {
  let sequence = await Sequence.findOne({ key });

  if (!sequence) {
    try {
      sequence = await Sequence.create({ key, value: 0 });
    } catch (error) {
      if (error?.code !== 11000) throw error;
      sequence = await Sequence.findOne({ key });
    }
  }

  // Existing records are preserved exactly as they are. New onboarding starts
  // at 001 and advances one-by-one; if an old record already owns a code,
  // the allocator skips it safely.
  for (let attempt = 0; attempt < 10000; attempt += 1) {
    const updated = await Sequence.findOneAndUpdate(
      { key },
      { $inc: { value: 1 } },
      { new: true }
    );

    const code = `${prefix}-${String(updated.value).padStart(3, '0')}`;
    const collision = await Model.exists({ [field]: code });

    if (!collision) return code;
  }

  throw new Error(`Unable to allocate a unique ${prefix} code.`);
}

export async function generateClientCode() {
  const Client = (await import('@/models/Client')).default;
  return nextSequentialCode({
    key: 'client_code',
    prefix: 'CL',
    Model: Client,
    field: 'clientCode',
  });
}

export async function generateVendorCode() {
  const Vendor = (await import('@/models/Vendor')).default;
  return nextSequentialCode({
    key: 'vendor_code',
    prefix: 'VN',
    Model: Vendor,
    field: 'vendorCode',
  });
}

export function generateProjectCode() {
  return `PRJ-${2000 + Math.floor(Math.random() * 8000)}`;
}

export function generateTempPassword() {
  const words = ['coral', 'amber', 'quartz', 'ivory', 'sable', 'lumen', 'ember', 'onyx'];
  const word = words[Math.floor(Math.random() * words.length)];
  const digits = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${word}${digits}`;
}
