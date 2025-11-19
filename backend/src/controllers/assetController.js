const { query } = require('../config/database');
const { uploadImage } = require('../config/cloudinary');

class AssetController {
    async upload(req, res) {
        try {
            const { brandId } = req.body;
            const files = req.files || [];
            const userId = req.user?.id || req.body.userId;
            
            if (!files.length) {
                return res.status(400).json({ error: 'No files provided' });
            }
            
            const uploaded = [];
            
            for (const file of files) {
                // Upload to Cloudinary (mock for now)
                const result = await uploadImage(file.path);
                
                // Save to database
                const dbResult = await query(`
                    INSERT INTO assets (
                        brand_id, user_id, original_url, 
                        cloudinary_public_id, file_type, category
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING id, original_url
                `, [
                    brandId,
                    userId,
                    result.secure_url,
                    result.public_id,
                    file.mimetype,
                    'upload'
                ]);
                
                uploaded.push(dbResult.rows[0]);
            }
            
            res.json({
                success: true,
                assets: uploaded
            });
            
        } catch (error) {
            console.error('Error uploading assets:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async list(req, res) {
        try {
            const { brandId, category } = req.query;
            const userId = req.user?.id;
            
            let queryText = 'SELECT * FROM assets WHERE user_id = $1';
            const params = [userId];
            let paramIndex = 2;
            
            if (brandId) {
                queryText += ` AND brand_id = $${paramIndex}`;
                params.push(brandId);
                paramIndex++;
            }
            
            if (category) {
                queryText += ` AND category = $${paramIndex}`;
                params.push(category);
            }
            
            queryText += ' ORDER BY created_at DESC';
            
            const result = await query(queryText, params);
            
            res.json({
                success: true,
                assets: result.rows
            });
            
        } catch (error) {
            console.error('Error listing assets:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async delete(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            
            // Delete from database
            await query(
                'DELETE FROM assets WHERE id = $1 AND user_id = $2',
                [id, userId]
            );
            
            res.json({
                success: true,
                message: 'Asset deleted'
            });
            
        } catch (error) {
            console.error('Error deleting asset:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new AssetController();
