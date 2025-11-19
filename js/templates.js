// Templates de créatives pour Meta Ads
class CreativeTemplates {
  constructor() {
    this.templates = {
      landscape: this.getLandscapeTemplates(),
      square: this.getSquareTemplates(),
      story: this.getStoryTemplates()
    };
  }

  // Templates Format Paysage (1200x628px) - Feed Facebook/Instagram
  getLandscapeTemplates() {
    return {
      dimensions: { width: 1200, height: 628 },
      layouts: [
        {
          id: 'split-screen',
          name: 'Split Screen',
          description: 'Design moderne avec texte et image côte à côte',
          icon: 'fa-columns',
          html: `
            <div style="width:1200px;height:628px;display:flex;overflow:hidden;font-family:{{bodyFont}},'Inter',sans-serif;">
              <div style="flex:1;padding:60px;display:flex;flex-direction:column;justify-content:center;background:{{backgroundColor}};">
                <h1 style="font-size:48px;margin:0 0 20px;color:{{textColor}};font-family:{{headingFont}},'Inter',sans-serif;font-weight:700;">{{headline}}</h1>
                <p style="font-size:20px;margin:0 0 30px;color:{{textColor}};opacity:0.8;line-height:1.5;">{{description}}</p>
                <button style="padding:15px 40px;font-size:18px;background:{{primaryColor}};color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;width:fit-content;">{{cta}}</button>
              </div>
              <div style="flex:1;background:url('{{image}}') center/cover;"></div>
            </div>
          `
        },
        {
          id: 'ugly-ads',
          name: 'High Converting Ugly',
          description: 'Style "Ugly Ads" qui convertit bien',
          icon: 'fa-fire',
          html: `
            <div style="width:1200px;height:628px;background:yellow;position:relative;overflow:hidden;font-family:'Arial',sans-serif;">
              <div style="background:red;color:white;padding:20px;font-size:72px;font-weight:bold;text-align:center;">
                🔥 {{headline}} 🔥
              </div>
              <img src="{{image}}" style="width:400px;position:absolute;right:50px;top:150px;border:10px solid red;transform:rotate(2deg);">
              <div style="position:absolute;bottom:0;left:0;right:0;background:black;color:yellow;padding:30px;text-align:center;">
                <span style="font-size:36px;font-weight:bold;">{{cta}} ➡️</span>
              </div>
              <div style="position:absolute;top:150px;left:50px;background:white;padding:20px;border:5px solid black;transform:rotate(-5deg);box-shadow:5px 5px 0 black;">
                <span style="font-size:48px;color:red;font-weight:bold;">{{price}}</span>
              </div>
              <div style="position:absolute;top:250px;left:80px;background:lime;padding:15px;transform:rotate(3deg);">
                <span style="font-size:24px;font-weight:bold;">{{urgency}}</span>
              </div>
            </div>
          `
        },
        {
          id: 'gradient-modern',
          name: 'Gradient Modern',
          description: 'Design avec dégradé moderne',
          icon: 'fa-palette',
          html: `
            <div style="width:1200px;height:628px;background:linear-gradient(135deg,{{primaryColor}},{{accentColor}});position:relative;overflow:hidden;font-family:{{bodyFont}},'Inter',sans-serif;">
              <div style="padding:80px;display:flex;align-items:center;height:100%;position:relative;z-index:2;">
                <div style="flex:1;">
                  <h1 style="font-size:56px;color:white;margin:0 0 20px;font-family:{{headingFont}},'Inter',sans-serif;font-weight:700;line-height:1.1;">{{headline}}</h1>
                  <p style="font-size:22px;color:white;margin:0 0 40px;opacity:0.95;line-height:1.5;">{{description}}</p>
                  <div style="display:flex;gap:20px;">
                    <button style="padding:18px 45px;font-size:18px;background:white;color:{{primaryColor}};border:none;border-radius:50px;font-weight:600;cursor:pointer;">{{cta}}</button>
                    <button style="padding:18px 45px;font-size:18px;background:transparent;color:white;border:2px solid white;border-radius:50px;font-weight:600;cursor:pointer;">{{secondaryCta}}</button>
                  </div>
                </div>
                <div style="flex:1;display:flex;justify-content:center;">
                  <img src="{{image}}" style="max-width:100%;height:auto;filter:drop-shadow(0 20px 40px rgba(0,0,0,0.3));">
                </div>
              </div>
              <div style="position:absolute;top:-100px;right:-100px;width:300px;height:300px;background:rgba(255,255,255,0.1);border-radius:50%;"></div>
              <div style="position:absolute;bottom:-150px;left:-150px;width:400px;height:400px;background:rgba(255,255,255,0.05);border-radius:50%;"></div>
            </div>
          `
        }
      ]
    };
  }

  // Templates Format Carré (1080x1080px) - Feed Instagram
  getSquareTemplates() {
    return {
      dimensions: { width: 1080, height: 1080 },
      layouts: [
        {
          id: 'centered-modern',
          name: 'Centered Modern',
          description: 'Design centré moderne avec gradient',
          icon: 'fa-square',
          html: `
            <div style="width:1080px;height:1080px;background:linear-gradient(135deg,{{primaryColor}},{{accentColor}});display:flex;flex-direction:column;justify-content:center;align-items:center;padding:80px;overflow:hidden;font-family:{{bodyFont}},'Inter',sans-serif;position:relative;">
              <img src="{{logo}}" style="height:80px;margin-bottom:40px;filter:brightness(0) invert(1);">
              <h1 style="font-size:64px;text-align:center;margin:0 0 30px;color:white;font-family:{{headingFont}},'Inter',sans-serif;font-weight:700;line-height:1.1;">{{headline}}</h1>
              <p style="font-size:24px;text-align:center;margin:0 0 40px;color:white;opacity:0.95;line-height:1.4;">{{description}}</p>
              <button style="padding:20px 60px;font-size:22px;border-radius:50px;background:white;color:{{primaryColor}};border:none;font-weight:600;cursor:pointer;">{{cta}}</button>
              <div style="position:absolute;top:-100px;right:-100px;width:300px;height:300px;background:rgba(255,255,255,0.1);border-radius:50%;"></div>
              <div style="position:absolute;bottom:-100px;left:-100px;width:250px;height:250px;background:rgba(255,255,255,0.08);border-radius:50%;"></div>
            </div>
          `
        },
        {
          id: 'bold-typography',
          name: 'Bold Typography',
          description: 'Focus sur la typographie',
          icon: 'fa-font',
          html: `
            <div style="width:1080px;height:1080px;background:{{primaryColor}};display:flex;flex-direction:column;justify-content:center;align-items:center;padding:60px;overflow:hidden;font-family:{{headingFont}},'Inter',sans-serif;position:relative;">
              <div style="position:absolute;top:0;left:0;right:0;bottom:0;opacity:0.1;">
                <div style="font-size:400px;font-weight:900;color:white;position:absolute;top:-100px;left:-50px;">{{bgLetter}}</div>
              </div>
              <div style="position:relative;z-index:2;text-align:center;">
                <h1 style="font-size:120px;color:white;margin:0 0 30px;font-weight:900;line-height:0.9;text-transform:uppercase;">{{headline}}</h1>
                <p style="font-size:24px;color:white;opacity:0.9;margin:0 0 50px;font-family:{{bodyFont}},'Inter',sans-serif;font-weight:400;">{{description}}</p>
                <button style="padding:20px 60px;font-size:20px;background:white;color:{{primaryColor}};border:none;border-radius:50px;font-weight:700;cursor:pointer;text-transform:uppercase;letter-spacing:2px;">{{cta}}</button>
              </div>
            </div>
          `
        },
        {
          id: 'minimalist',
          name: 'Minimalist',
          description: 'Design épuré minimaliste',
          icon: 'fa-minus',
          html: `
            <div style="width:1080px;height:1080px;background:white;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:100px;font-family:{{bodyFont}},'Inter',sans-serif;overflow:hidden;">
              <div style="width:200px;height:200px;background:{{primaryColor}};border-radius:50%;margin-bottom:60px;display:flex;align-items:center;justify-content:center;">
                <span style="font-size:100px;color:white;">{{icon}}</span>
              </div>
              <h1 style="font-size:56px;color:{{textColor}};text-align:center;margin:0 0 30px;font-family:{{headingFont}},'Inter',sans-serif;font-weight:300;letter-spacing:-1px;">{{headline}}</h1>
              <p style="font-size:22px;color:{{textColor}};opacity:0.6;text-align:center;margin:0 0 50px;line-height:1.5;">{{description}}</p>
              <button style="padding:18px 50px;font-size:18px;background:{{textColor}};color:white;border:none;border-radius:5px;font-weight:500;cursor:pointer;">{{cta}}</button>
            </div>
          `
        }
      ]
    };
  }

  // Templates Format Story (1080x1920px) - Stories/Reels
  getStoryTemplates() {
    return {
      dimensions: { width: 1080, height: 1920 },
      layouts: [
        {
          id: 'full-screen-impact',
          name: 'Full Screen Impact',
          description: 'Impact visuel plein écran',
          icon: 'fa-mobile-alt',
          html: `
            <div style="width:1080px;height:1920px;background:url('{{bgImage}}') center/cover;position:relative;overflow:hidden;font-family:{{bodyFont}},'Inter',sans-serif;">
              <div style="background:linear-gradient(to bottom,rgba(0,0,0,0.2),rgba(0,0,0,0.7));position:absolute;inset:0;">
                <div style="padding:100px 60px;height:100%;display:flex;flex-direction:column;">
                  <img src="{{logo}}" style="height:60px;margin-bottom:auto;filter:brightness(0) invert(1);">
                  <h1 style="font-size:72px;color:white;margin:0 0 30px;font-family:{{headingFont}},'Inter',sans-serif;font-weight:700;line-height:1;">{{headline}}</h1>
                  <p style="font-size:28px;color:white;margin:0 0 50px;opacity:0.95;line-height:1.4;">{{description}}</p>
                  <button style="padding:25px 50px;font-size:24px;border-radius:50px;background:white;color:{{primaryColor}};border:none;font-weight:600;cursor:pointer;">{{cta}}</button>
                  <div style="display:flex;gap:10px;margin-top:30px;justify-content:center;">
                    <div style="width:40px;height:4px;background:white;border-radius:2px;"></div>
                    <div style="width:40px;height:4px;background:rgba(255,255,255,0.3);border-radius:2px;"></div>
                    <div style="width:40px;height:4px;background:rgba(255,255,255,0.3);border-radius:2px;"></div>
                  </div>
                </div>
              </div>
            </div>
          `
        },
        {
          id: 'gradient-story',
          name: 'Gradient Story',
          description: 'Story avec dégradé moderne',
          icon: 'fa-fill',
          html: `
            <div style="width:1080px;height:1920px;background:linear-gradient(135deg,{{primaryColor}},{{accentColor}});position:relative;overflow:hidden;font-family:{{bodyFont}},'Inter',sans-serif;">
              <div style="position:absolute;top:-200px;right:-200px;width:600px;height:600px;background:rgba(255,255,255,0.1);border-radius:50%;"></div>
              <div style="position:absolute;bottom:-300px;left:-300px;width:800px;height:800px;background:rgba(255,255,255,0.05);border-radius:50%;"></div>
              <div style="padding:100px 60px;height:100%;display:flex;flex-direction:column;position:relative;z-index:2;">
                <div style="margin-bottom:auto;">
                  <img src="{{logo}}" style="height:60px;filter:brightness(0) invert(1);">
                </div>
                <div style="text-align:center;">
                  <h1 style="font-size:84px;color:white;margin:0 0 40px;font-family:{{headingFont}},'Inter',sans-serif;font-weight:800;line-height:0.9;">{{headline}}</h1>
                  <p style="font-size:32px;color:white;margin:0 0 60px;opacity:0.95;line-height:1.3;">{{description}}</p>
                  <button style="padding:30px 80px;font-size:26px;border-radius:50px;background:white;color:{{primaryColor}};border:none;font-weight:600;cursor:pointer;">{{cta}}</button>
                </div>
                <div style="margin-top:auto;text-align:center;">
                  <p style="font-size:20px;color:white;opacity:0.7;">
                    <i style="margin-right:10px;">👆</i>Swipe up
                  </p>
                </div>
              </div>
            </div>
          `
        },
        {
          id: 'product-story',
          name: 'Product Story',
          description: 'Focus sur le produit',
          icon: 'fa-shopping-cart',
          html: `
            <div style="width:1080px;height:1920px;background:{{backgroundColor}};position:relative;overflow:hidden;font-family:{{bodyFont}},'Inter',sans-serif;">
              <div style="height:60%;background:linear-gradient(135deg,{{primaryColor}},{{accentColor}});position:relative;display:flex;align-items:center;justify-content:center;">
                <img src="{{productImage}}" style="max-width:80%;height:auto;filter:drop-shadow(0 20px 40px rgba(0,0,0,0.3));">
                <div style="position:absolute;top:60px;left:60px;">
                  <img src="{{logo}}" style="height:50px;filter:brightness(0) invert(1);">
                </div>
                <div style="position:absolute;top:60px;right:60px;background:white;color:{{primaryColor}};padding:15px 30px;border-radius:30px;font-weight:600;font-size:20px;">
                  {{badge}}
                </div>
              </div>
              <div style="padding:60px;background:white;">
                <h2 style="font-size:56px;color:{{textColor}};margin:0 0 30px;font-family:{{headingFont}},'Inter',sans-serif;font-weight:700;">{{productName}}</h2>
                <div style="display:flex;align-items:center;gap:30px;margin-bottom:40px;">
                  <span style="font-size:64px;color:{{primaryColor}};font-weight:700;">{{price}}</span>
                  <span style="font-size:32px;color:#999;text-decoration:line-through;">{{oldPrice}}</span>
                </div>
                <p style="font-size:24px;color:{{textColor}};opacity:0.7;margin:0 0 50px;line-height:1.4;">{{productDescription}}</p>
                <button style="width:100%;padding:30px;font-size:26px;background:{{primaryColor}};color:white;border:none;border-radius:15px;font-weight:600;cursor:pointer;">{{cta}}</button>
              </div>
            </div>
          `
        }
      ]
    };
  }

  // Obtenir un template spécifique
  getTemplate(format, templateId) {
    const formatTemplates = this.templates[format];
    if (!formatTemplates) return null;
    
    return formatTemplates.layouts.find(t => t.id === templateId);
  }

  // Obtenir tous les templates d'un format
  getTemplatesByFormat(format) {
    return this.templates[format] || null;
  }

  // Obtenir la liste des formats disponibles
  getAvailableFormats() {
    return Object.keys(this.templates);
  }

  // Obtenir les dimensions d'un format
  getFormatDimensions(format) {
    return this.templates[format]?.dimensions || null;
  }

  // Remplacer les variables dans un template
  applyVariables(html, variables) {
    let result = html;
    
    // Remplacer toutes les variables
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, variables[key] || '');
    });
    
    // Nettoyer les variables non remplacées
    result = result.replace(/{{[^}]+}}/g, '');
    
    return result;
  }

  // Générer une prévisualisation
  generatePreview(format, templateId, variables) {
    const template = this.getTemplate(format, templateId);
    if (!template) return null;
    
    const html = this.applyVariables(template.html, variables);
    return {
      format,
      templateId,
      name: template.name,
      dimensions: this.getFormatDimensions(format),
      html
    };
  }
}

// Export pour utilisation dans d'autres modules
window.CreativeTemplates = CreativeTemplates;
