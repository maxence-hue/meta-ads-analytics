const templateService = require('../services/templateService');

class TemplateController {
    async list(req, res) {
        try {
            const { category, search } = req.query;
            const result = await templateService.list({ category, search });
            res.json(result);
        } catch (error) {
            console.error('Error listing templates:', error);
            res.status(500).json({ error: error.message });
        }
    }

    async get(req, res) {
        try {
            const { id } = req.params;
            const result = await templateService.get(id);
            res.json(result);
        } catch (error) {
            console.error('Error getting template:', error);
            res.status(404).json({ error: error.message });
        }
    }

    async preview(req, res) {
        try {
            const { id } = req.params;
            const { brandId } = req.body;
            
            if (!brandId) {
                return res.status(400).json({ error: 'brandId is required' });
            }
            
            const result = await templateService.preview(id, brandId);
            res.json(result);
        } catch (error) {
            console.error('Error generating preview:', error);
            res.status(500).json({ error: error.message });
        }
    }

    async search(req, res) {
        try {
            const { q } = req.query;
            const result = await templateService.list({ search: q });
            res.json(result);
        } catch (error) {
            console.error('Error searching templates:', error);
            res.status(500).json({ error: error.message });
        }
    }

    async duplicate(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id || req.body.userId;
            
            // Get original template
            const original = await templateService.get(id);
            
            // Create a copy with new ID
            const duplicated = {
                ...original.template,
                id: `${original.template.id}-copy-${Date.now()}`,
                name: `${original.template.name} (Copy)`,
                is_custom: true,
                created_by: userId
            };
            
            res.json({
                success: true,
                template: duplicated
            });
        } catch (error) {
            console.error('Error duplicating template:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new TemplateController();
