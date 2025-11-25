/**
 * Script de test pour vérifier la connexion Gemini Imagen
 */

require('dotenv').config();
const imageGeneration = require('./src/services/imageGeneration');

async function testGeminiConnection() {
    console.log('==========================================');
    console.log('🧪 Test de connexion Gemini Imagen 4.0');
    console.log('==========================================\n');

    // 1. Vérifier les variables d'environnement
    console.log('1️⃣ Vérification des clés API:');
    console.log(`   GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ Configurée' : '❌ Manquante'}`);
    console.log(`   GOOGLE_API_KEY: ${process.env.GOOGLE_API_KEY ? '✅ Configurée' : '❌ Manquante'}`);

    if (process.env.GEMINI_API_KEY) {
        const key = process.env.GEMINI_API_KEY;
        console.log(`   Format: ${key.substring(0, 8)}...${key.substring(key.length - 4)}`);
    }
    console.log('');

    // 2. Vérifier la connexion
    console.log('2️⃣ Test de connexion:');
    try {
        const status = await imageGeneration.checkGeminiConnection();
        console.log(`   Connecté: ${status.connected ? '✅' : '❌'}`);
        console.log(`   Message: ${status.message}`);
        console.log(`   Provider: ${status.provider}`);
    } catch (error) {
        console.log(`   ❌ Erreur: ${error.message}`);
    }
    console.log('');

    // 3. Test de génération d'image simple
    console.log('3️⃣ Test de génération d\'image:');
    try {
        const result = await imageGeneration.generate(
            'A professional business meeting in a modern office, photorealistic, high quality',
            '1:1'
        );

        console.log(`   ✅ Génération réussie`);
        console.log(`   Provider: ${result.provider || 'inconnu'}`);
        console.log(`   Filename: ${result.filename}`);
        console.log(`   URL type: ${result.url.startsWith('data:') ? 'Base64' : 'URL externe'}`);
        console.log(`   Success: ${result.success ? 'Oui' : 'Non'}`);
    } catch (error) {
        console.log(`   ❌ Erreur: ${error.message}`);
    }
    console.log('');

    // 4. Test de génération complète avec backgroundImage
    console.log('4️⃣ Test de génération complète (backgroundImage):');
    try {
        const result = await imageGeneration.generateBackgroundImage({
            prompt: 'Modern tech startup office space with collaboration',
            style: 'realistic',
            aspectRatio: '1:1',
            colors: ['#3B82F6', '#10B981', '#F59E0B'],
            campaign: { theme: 'Innovation' },
            brand: { tone: 'professional' }
        });

        console.log(`   ✅ Génération réussie`);
        console.log(`   Provider: ${result.metadata?.provider || 'inconnu'}`);
        console.log(`   Local path: ${result.localPath || 'N/A'}`);
        console.log(`   Metadata:`, JSON.stringify(result.metadata, null, 2));
    } catch (error) {
        console.log(`   ❌ Erreur: ${error.message}`);
    }
    console.log('');

    console.log('==========================================');
    console.log('✅ Test terminé');
    console.log('==========================================');
}

// Exécuter le test
testGeminiConnection()
    .then(() => {
        console.log('\n✅ Tous les tests sont terminés');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Erreur critique:', error);
        process.exit(1);
    });
