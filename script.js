// Générateur de Créatives Meta avec Scraping
let brandData = {};
let generatedCreatives = [];
const API_URL = 'http://localhost:3000/api';

// Fonction pour analyser un site web
async function analyzeBrand() {
    const url = document.getElementById('websiteUrl').value.trim();
    
    if (!url) {
        showNotification('Veuillez entrer une URL', 'error');
        return;
    }
    
    // Validation basique de l'URL
    try {
        new URL(url);
    } catch (e) {
        showNotification('URL invalide. Format attendu: https://www.exemple.com', 'error');
        return;
    }
    
    showLoading(true, 'Analyse du site en cours...');
    
    try {
        const response = await fetch(`${API_URL}/scrape`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Erreur lors de l\'analyse');
        }
        
        if (result.success) {
            brandData = result.data;
            displayBrandInfo(brandData);
            showNotification('Site analysé avec succès ! Vous pouvez maintenant modifier les informations.', 'success');
        }
        
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Impossible d\'analyser le site. Vérifiez l\'URL et réessayez.', 'error');
    } finally {
        showLoading(false);
    }
}

// Afficher les informations de marque extraites
function displayBrandInfo(data) {
    // Afficher la section d'infos
    document.getElementById('brandInfoDisplay').classList.remove('hidden');
    
    // Nom de la marque
    document.getElementById('brandName').value = data.brandName || '';
    
    // Description
    document.getElementById('brandDescription').value = data.description || data.content?.metaDescription || '';
    
    // Couleurs
    const colorsContainer = document.getElementById('brandColors');
    colorsContainer.innerHTML = '';
    
    if (data.colors && data.colors.length > 0) {
        data.colors.forEach(color => {
            const colorDiv = document.createElement('div');
            colorDiv.className = 'w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-300 hover:border-purple-500 transition';
            colorDiv.style.backgroundColor = color;
            colorDiv.title = color;
            colorDiv.onclick = () => {
                navigator.clipboard.writeText(color);
                showNotification(`Couleur ${color} copiée !`, 'success');
            };
            colorsContainer.appendChild(colorDiv);
        });
        
        // Remplir aussi l'input
        document.getElementById('brandColorsInput').value = data.colors.join(', ');
    }
    
    // Polices
    if (data.fonts && data.fonts.length > 0) {
        document.getElementById('brandFonts').value = data.fonts.join(', ');
    }
    
    // Images
    const imagesContainer = document.getElementById('brandImages');
    imagesContainer.innerHTML = '';
    
    if (data.images && data.images.length > 0) {
        data.images.slice(0, 8).forEach((img, index) => {
            const imgContainer = document.createElement('div');
            imgContainer.className = 'relative group cursor-pointer overflow-hidden rounded-lg border-2 border-transparent hover:border-purple-500 transition';
            imgContainer.innerHTML = `
                <img src="${img.url}" alt="${img.alt}" 
                     class="w-full h-24 object-cover"
                     onerror="this.parentElement.style.display='none'">
                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition flex items-center justify-center">
                    <button onclick="selectImage('${img.url}')" class="text-white opacity-0 group-hover:opacity-100 transition">
                        <i class="fas fa-check-circle text-2xl"></i>
                    </button>
                </div>
            `;
            imagesContainer.appendChild(imgContainer);
        });
    } else {
        imagesContainer.innerHTML = '<p class="text-gray-500 text-sm col-span-4">Aucune image trouvée</p>';
    }
    
    // Stocker les données
    window.extractedBrandData = data;
}

// Sélectionner une image
function selectImage(url) {
    showNotification('Image sélectionnée !', 'success');
    window.selectedImage = url;
}

// Passer à l'étape de génération de créatives
function goToCreativeGeneration() {
    // Récupérer les données (éventuellement modifiées manuellement)
    brandData.brandName = document.getElementById('brandName').value;
    brandData.description = document.getElementById('brandDescription').value;
    brandData.colors = document.getElementById('brandColorsInput').value.split(',').map(c => c.trim());
    brandData.fonts = document.getElementById('brandFonts').value.split(',').map(f => f.trim());
    
    if (!brandData.brandName) {
        showNotification('Veuillez renseigner au minimum le nom de la marque', 'error');
        return;
    }
    
    // Changer d'étape
    document.getElementById('brandConfigSection').classList.add('hidden');
    document.getElementById('creativeInputSection').classList.remove('hidden');
    
    // Mettre à jour les indicateurs
    document.getElementById('step1-indicator').classList.remove('bg-purple-600', 'text-white');
    document.getElementById('step1-indicator').classList.add('bg-gray-300', 'text-gray-600');
    document.getElementById('step2-indicator').classList.remove('bg-gray-300', 'text-gray-600');
    document.getElementById('step2-indicator').classList.add('bg-purple-600', 'text-white');
    
    // Pré-remplir le formulaire de génération
    document.getElementById('productName').value = brandData.brandName;
    if (brandData.description) {
        document.getElementById('productDescription').value = brandData.description.substring(0, 200);
    }
    
    showNotification('Configuration terminée ! Remplissez les derniers détails pour générer vos créatives.', 'success');
}

// Générer les créatives (fonction existante adaptée)
function generateCreatives() {
    const config = getConfig();
    
    if (!validateConfig(config)) {
        showNotification('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }
    
    showLoading(true, 'Génération des créatives en cours...');
    
    setTimeout(() => {
        const generator = new MetaCreativeGenerator();
        generatedCreatives = generator.generateCreative(config, brandData);
        displayCreatives(generatedCreatives);
        showLoading(false);
        showNotification(`${generatedCreatives.length} créatives générées avec succès !`, 'success');
    }, 2000);
}

// Classe MetaCreativeGenerator (simplifiée pour l'exemple)
class MetaCreativeGenerator {
    generateCreative(config, brandData) {
        const creatives = [];
        const platforms = config.platforms;
        
        platforms.forEach(platform => {
            const creative = {
                id: Math.random().toString(36).substr(2, 9),
                platform: platform,
                product: config.product,
                headline: this.generateHeadline(config.product, platform, brandData),
                description: this.generateDescription(config.description, platform, brandData),
                cta: this.generateCTA(config.objective, platform),
                colors: brandData.colors || ['#667eea', '#764ba2'],
                fonts: brandData.fonts || ['Inter'],
                image: window.selectedImage || `https://picsum.photos/seed/${platform}/400/300`,
                objective: config.objective,
                visualStyle: config.visualStyle
            };
            
            creatives.push(creative);
        });
        
        return creatives;
    }
    
    generateHeadline(product, platform, brandData) {
        const templates = {
            facebook: [`Découvrez ${product}`, `${product} - Nouveau`, `Offre exclusive ${product}`],
            instagram: [`✨ ${product} ✨`, `🔥 ${product}`, `💎 ${product}`],
            stories: [`${product}`, `Nouveau !`, `Offre limitée`]
        };
        
        const selected = templates[platform];
        return selected[Math.floor(Math.random() * selected.length)];
    }
    
    generateDescription(description, platform, brandData) {
        const maxLength = platform === 'stories' ? 50 : 150;
        return description.substring(0, maxLength) + (description.length > maxLength ? '...' : '');
    }
    
    generateCTA(objective, platform) {
        const ctas = {
            awareness: ['En savoir plus', 'Découvrir'],
            traffic: ['Visiter le site', 'Voir plus'],
            engagement: ['Commenter', 'Partager'],
            conversions: ['S\'inscrire', 'Télécharger'],
            sales: ['Acheter', 'Commander']
        };
        
        const options = ctas[objective] || ['En savoir plus'];
        return options[Math.floor(Math.random() * options.length)];
    }
}

// Fonctions utilitaires
function getConfig() {
    const platforms = [];
    document.querySelectorAll('.platform-checkbox:checked').forEach(cb => {
        platforms.push(cb.value);
    });
    
    return {
        product: document.getElementById('productName').value,
        description: document.getElementById('productDescription').value,
        objective: document.getElementById('campaignObjective').value,
        audience: document.getElementById('targetAudience').value,
        platforms: platforms,
        visualStyle: document.getElementById('visualStyle').value
    };
}

function validateConfig(config) {
    return config.product && 
           config.description && 
           config.objective && 
           config.platforms.length > 0;
}

function showLoading(show, message = 'Chargement...') {
    const loadingState = document.getElementById('loadingState');
    const resultsSection = document.getElementById('resultsSection');
    
    if (show) {
        if (loadingState) {
            loadingState.classList.remove('hidden');
            const loadingText = loadingState.querySelector('p');
            if (loadingText) loadingText.textContent = message;
        }
        if (resultsSection) resultsSection.classList.add('hidden');
    } else {
        if (loadingState) loadingState.classList.add('hidden');
    }
}

function displayCreatives(creatives) {
    const container = document.getElementById('creativesContainer');
    const resultsSection = document.getElementById('resultsSection');
    
    if (!container || !resultsSection) return;
    
    container.innerHTML = creatives.map(creative => formatCreativeCard(creative)).join('');
    resultsSection.classList.remove('hidden');
}

function formatCreativeCard(creative) {
    const platformIcons = {
        facebook: 'fab fa-facebook',
        instagram: 'fab fa-instagram',
        stories: 'fas fa-camera'
    };
    
    const platformColors = {
        facebook: 'bg-blue-600',
        instagram: 'bg-gradient-to-r from-pink-500 to-purple-500',
        stories: 'bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500'
    };
    
    return `
        <div class="creative-card bg-white rounded-xl shadow-lg overflow-hidden">
            <div class="${platformColors[creative.platform]} text-white p-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                        <i class="${platformIcons[creative.platform]} text-xl"></i>
                        <span class="font-semibold capitalize">${creative.platform}</span>
                    </div>
                </div>
            </div>
            
            <div class="p-4">
                <div class="mb-4">
                    <img src="${creative.image}" alt="${creative.product}" 
                         class="w-full h-48 object-cover rounded-lg">
                </div>
                
                <div class="space-y-3">
                    <div>
                        <h4 class="font-semibold text-gray-800 mb-1">Titre:</h4>
                        <p class="text-gray-700 font-medium">${creative.headline}</p>
                    </div>
                    
                    <div>
                        <h4 class="font-semibold text-gray-800 mb-1">Description:</h4>
                        <p class="text-gray-600 text-sm">${creative.description}</p>
                    </div>
                    
                    <div class="flex items-center justify-between pt-3 border-t">
                        <span class="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                            ${creative.cta}
                        </span>
                        <button onclick="copyCreative('${creative.id}')" class="text-gray-500 hover:text-purple-600 transition" title="Copier">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function copyCreative(creativeId) {
    const creative = generatedCreatives.find(c => c.id === creativeId);
    if (!creative) return;
    
    const text = `
Plateforme: ${creative.platform.toUpperCase()}
Titre: ${creative.headline}
Description: ${creative.description}
CTA: ${creative.cta}
Objectif: ${creative.objective}
    `.trim();
    
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Créative copiée dans le presse-papiers !', 'success');
    });
}

function exportCreatives() {
    if (generatedCreatives.length === 0) {
        showNotification('Aucune créative à exporter', 'error');
        return;
    }
    
    const exportData = {
        brandData: brandData,
        creatives: generatedCreatives
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `meta-creatives-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showNotification('Créatives exportées avec succès !', 'success');
}

function showNotification(message, type = 'info') {
    // Créer une notification temporaire
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-50 transform transition-all duration-300`;
    
    const colors = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        info: 'bg-blue-600'
    };
    
    notification.classList.add(colors[type] || colors.info);
    notification.innerHTML = `
        <div class="flex items-center space-x-2">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    // Platform checkbox styling
    document.querySelectorAll('.platform-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const label = this.closest('label');
            if (this.checked) {
                label.classList.add('ring-2', 'ring-purple-500');
            } else {
                label.classList.remove('ring-2', 'ring-purple-500');
            }
        });
    });
    
    console.log('✅ Générateur de Créatives Meta chargé');
    console.log('📡 API serveur: ' + API_URL);
});
