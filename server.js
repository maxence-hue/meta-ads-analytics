const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Endpoint pour scraper un site web
app.post('/api/scrape', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL manquante' });
        }

        console.log(`Scraping ${url}...`);
        
        // Récupérer le contenu HTML
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });

        const html = response.data;
        const $ = cheerio.load(html);
        
        // Extraction des couleurs
        const colors = extractColors($, html);
        
        // Extraction des polices
        const fonts = extractFonts($, html);
        
        // Extraction des images
        const images = extractImages($, url);
        
        // Extraction du contenu
        const content = extractContent($);
        
        // Informations de marque
        const brandInfo = extractBrandInfo($, url);
        
        res.json({
            success: true,
            data: {
                url,
                brandName: brandInfo.name,
                description: brandInfo.description,
                colors,
                fonts,
                images,
                content
            }
        });
        
    } catch (error) {
        console.error('Erreur de scraping:', error.message);
        res.status(500).json({ 
            error: 'Erreur lors du scraping du site',
            message: error.message 
        });
    }
});

// Fonction pour extraire les couleurs
function extractColors($, html) {
    const colors = new Set();
    
    // Couleurs depuis les styles inline
    $('[style]').each((i, el) => {
        const style = $(el).attr('style');
        const colorMatches = style.match(/#([0-9A-F]{3}){1,2}|rgb\([0-9, ]+\)|rgba\([0-9, .]+\)/gi);
        if (colorMatches) {
            colorMatches.forEach(color => colors.add(color));
        }
    });
    
    // Couleurs depuis les feuilles de style
    const styleContent = $('style').text();
    const cssColors = styleContent.match(/#([0-9A-F]{3}){1,2}|rgb\([0-9, ]+\)|rgba\([0-9, .]+\)/gi);
    if (cssColors) {
        cssColors.forEach(color => colors.add(color));
    }
    
    // Convertir les couleurs RGB en HEX
    const hexColors = Array.from(colors).map(color => {
        if (color.startsWith('rgb')) {
            return rgbToHex(color);
        }
        return color;
    }).filter(color => color && color.match(/^#[0-9A-F]{6}$/i));
    
    return [...new Set(hexColors)].slice(0, 5);
}

// Fonction pour extraire les polices
function extractFonts($, html) {
    const fonts = new Set();
    
    // Polices depuis les styles inline
    $('[style]').each((i, el) => {
        const style = $(el).attr('style');
        const fontMatch = style.match(/font-family:\s*([^;]+)/i);
        if (fontMatch) {
            const fontFamily = fontMatch[1].split(',')[0].replace(/['"]/g, '').trim();
            fonts.add(fontFamily);
        }
    });
    
    // Polices depuis les feuilles de style
    const styleContent = $('style').text();
    const cssFonts = styleContent.match(/font-family:\s*([^;}]+)/gi);
    if (cssFonts) {
        cssFonts.forEach(font => {
            const fontFamily = font.split(':')[1].split(',')[0].replace(/['"]/g, '').trim();
            fonts.add(fontFamily);
        });
    }
    
    // Polices depuis Google Fonts
    $('link[href*="fonts.googleapis.com"]').each((i, el) => {
        const href = $(el).attr('href');
        const fontMatch = href.match(/family=([^:&]+)/);
        if (fontMatch) {
            fonts.add(fontMatch[1].replace(/\+/g, ' '));
        }
    });
    
    return Array.from(fonts).filter(f => f && f.length > 0).slice(0, 3);
}

// Fonction pour extraire les images
function extractImages($, baseUrl) {
    const images = [];
    const seenUrls = new Set();
    
    $('img').each((i, el) => {
        let src = $(el).attr('src') || $(el).attr('data-src');
        if (src && !src.startsWith('data:')) {
            // Convertir en URL absolue
            if (src.startsWith('/')) {
                const urlObj = new URL(baseUrl);
                src = urlObj.origin + src;
            } else if (!src.startsWith('http')) {
                src = new URL(src, baseUrl).href;
            }
            
            if (!seenUrls.has(src)) {
                images.push({
                    url: src,
                    alt: $(el).attr('alt') || ''
                });
                seenUrls.add(src);
            }
        }
    });
    
    return images.slice(0, 10);
}

// Fonction pour extraire le contenu
function extractContent($) {
    const content = {
        title: $('title').text() || '',
        metaDescription: $('meta[name="description"]').attr('content') || '',
        headings: [],
        paragraphs: []
    };
    
    // Extraire les titres H1, H2
    $('h1, h2').each((i, el) => {
        const text = $(el).text().trim();
        if (text && i < 5) {
            content.headings.push(text);
        }
    });
    
    // Extraire quelques paragraphes
    $('p').each((i, el) => {
        const text = $(el).text().trim();
        if (text && text.length > 20 && i < 5) {
            content.paragraphs.push(text);
        }
    });
    
    return content;
}

// Fonction pour extraire les infos de marque
function extractBrandInfo($, url) {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    
    return {
        name: $('meta[property="og:site_name"]').attr('content') || 
              $('meta[name="application-name"]').attr('content') ||
              domain.split('.')[0],
        description: $('meta[name="description"]').attr('content') || 
                    $('meta[property="og:description"]').attr('content') || ''
    };
}

// Fonction utilitaire pour convertir RGB en HEX
function rgbToHex(rgb) {
    const match = rgb.match(/\d+/g);
    if (!match || match.length < 3) return null;
    
    const r = parseInt(match[0]);
    const g = parseInt(match[1]);
    const b = parseInt(match[2]);
    
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

app.listen(PORT, () => {
    console.log(`✅ Serveur de scraping démarré sur http://localhost:${PORT}`);
    console.log(`📡 API disponible sur http://localhost:${PORT}/api/scrape`);
});
