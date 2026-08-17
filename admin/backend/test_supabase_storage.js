const { supabase, isConfigured } = require('./src/database/supabase');

async function test() {
  if (!isConfigured) {
    console.error('Supabase is not configured!');
    return;
  }

  try {
    console.log('Listing Supabase storage buckets...');
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
      console.error('Failed to list buckets:', error.message);
      return;
    }
    console.log('Existing buckets:', buckets);

    // Let's check if we have a bucket named 'ushamart' or 'categories'
    // If not, let's try to create a public bucket named 'ushamart'
    const bucketName = 'ushamart';
    const exists = buckets.find(b => b.name === bucketName);
    if (!exists) {
      console.log(`Bucket '${bucketName}' does not exist. Attempting to create it...`);
      const { data, error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5242880 // 5MB
      });
      if (createError) {
        console.error('Failed to create bucket:', createError.message);
      } else {
        console.log(`Bucket '${bucketName}' created successfully!`, data);
      }
    } else {
      console.log(`Bucket '${bucketName}' already exists.`);
    }

  } catch (err) {
    console.error('Unexpected error:', err.message);
  }
}

test();
