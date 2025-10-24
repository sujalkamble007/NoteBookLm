import 'dotenv/config';
import vectorSearchService from '../src/services/vectorSearch.service.js';
import embeddingService from '../src/services/embedding.service.js';

async function setupVectorSearch() {
  console.log('🚀 Setting up MongoDB Atlas Vector Search...\n');

  try {
    // 1. Test embedding service
    console.log('1. Testing Hugging Face embedding service...');
    const testText = 'This is a test document for vector search setup';
    const embedding = await embeddingService.generateEmbedding(testText);
    console.log(`✅ Generated embedding with ${embedding.length} dimensions\n`);

    // 2. Display vector index configuration
    console.log('2. Vector Search Index Configuration:');
    await vectorSearchService.createVectorIndex();
    
    console.log('\n📋 Setup Instructions:');
    console.log('1. Go to MongoDB Atlas Dashboard');
    console.log('2. Navigate to your cluster → Search → Create Index');
    console.log('3. Choose "JSON Editor" and paste the index specification above');
    console.log('4. Name the index "vector_index"');
    console.log('5. Select your database and "documents" collection');
    console.log('6. Click "Create Search Index"\n');

    // 3. Test chunking
    console.log('3. Testing text chunking...');
    const longText = `
      Artificial Intelligence (AI) is revolutionizing the way we work, live, and interact with technology. 
      Machine learning algorithms can now process vast amounts of data to identify patterns and make predictions 
      that were previously impossible for humans to detect. Deep learning networks, inspired by the human brain's 
      neural structure, are capable of learning complex representations from raw data. Natural language processing 
      enables computers to understand and generate human language with remarkable accuracy. Computer vision systems 
      can now recognize objects, faces, and scenes with superhuman precision. The applications of AI span across 
      industries including healthcare, finance, transportation, education, and entertainment.
    `;
    
    const chunks = embeddingService.chunkText(longText, 200, 20);
    console.log(`✅ Created ${chunks.length} text chunks\n`);

    console.log('✅ Vector search setup validation completed!');
    console.log('\n🎯 Next Steps:');
    console.log('1. Create the vector index in MongoDB Atlas (see instructions above)');
    console.log('2. Upload some test documents via the frontend');
    console.log('3. Try asking questions about your documents');
    console.log('4. Check the vector search functionality in the dashboard\n');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
setupVectorSearch()
  .then(() => {
    console.log('🎉 Setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error during setup:', error);
    process.exit(1);
  });