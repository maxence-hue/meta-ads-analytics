const { query } = require('../config/database');

class LibraryController {
    // Gestion des dossiers
    async getFolders(req, res) {
        try {
            const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
            
            const result = await query(`
                SELECT 
                    f.*,
                    COUNT(DISTINCT c.id) as creatives_count,
                    COUNT(DISTINCT sf.id) as subfolders_count
                FROM folders f
                LEFT JOIN creatives c ON c.folder_id = f.id
                LEFT JOIN folders sf ON sf.parent_id = f.id
                WHERE f.user_id = $1
                GROUP BY f.id
                ORDER BY f.name ASC
            `, [userId]);
            
            // Organiser en arbre
            const folders = result.rows;
            const tree = this.buildFolderTree(folders);
            
            res.json({
                success: true,
                folders: tree
            });
        } catch (error) {
            console.error('Error getting folders:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async createFolder(req, res) {
        try {
            const { name, parentId } = req.body;
            const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
            
            if (!name) {
                return res.status(400).json({ error: 'Name is required' });
            }
            
            const result = await query(`
                INSERT INTO folders (name, parent_id, user_id)
                VALUES ($1, $2, $3)
                RETURNING *
            `, [name, parentId || null, userId]);
            
            res.json({
                success: true,
                folder: result.rows[0]
            });
        } catch (error) {
            console.error('Error creating folder:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async moveCreative(req, res) {
        try {
            const { creativeId, folderId } = req.body;
            const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
            
            if (!creativeId) {
                return res.status(400).json({ error: 'creativeId is required' });
            }
            
            // Vérifier que le dossier appartient à l'utilisateur
            if (folderId) {
                const folderCheck = await query(
                    'SELECT id FROM folders WHERE id = $1 AND user_id = $2',
                    [folderId, userId]
                );
                
                if (folderCheck.rows.length === 0) {
                    return res.status(403).json({ error: 'Folder not found or access denied' });
                }
            }
            
            // Mettre à jour la créative
            await query(
                'UPDATE creatives SET folder_id = $1 WHERE id = $2 AND user_id = $3',
                [folderId || null, creativeId, userId]
            );
            
            res.json({
                success: true,
                message: 'Creative moved successfully'
            });
        } catch (error) {
            console.error('Error moving creative:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    // Gestion des favoris
    async getFavorites(req, res) {
        try {
            const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
            
            const result = await query(`
                SELECT 
                    c.*,
                    b.name as brand_name,
                    t.name as template_name
                FROM creatives c
                LEFT JOIN brands b ON c.brand_id = b.id
                LEFT JOIN templates t ON c.template_id = t.id
                WHERE c.user_id = $1 AND c.is_favorite = true
                ORDER BY c.created_at DESC
            `, [userId]);
            
            res.json({
                success: true,
                favorites: result.rows
            });
        } catch (error) {
            console.error('Error getting favorites:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async addFavorite(req, res) {
        try {
            const { creativeId } = req.body;
            const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
            
            if (!creativeId) {
                return res.status(400).json({ error: 'creativeId is required' });
            }
            
            await query(
                'UPDATE creatives SET is_favorite = true WHERE id = $1 AND user_id = $2',
                [creativeId, userId]
            );
            
            res.json({
                success: true,
                message: 'Added to favorites'
            });
        } catch (error) {
            console.error('Error adding favorite:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async removeFavorite(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
            
            await query(
                'UPDATE creatives SET is_favorite = false WHERE id = $1 AND user_id = $2',
                [id, userId]
            );
            
            res.json({
                success: true,
                message: 'Removed from favorites'
            });
        } catch (error) {
            console.error('Error removing favorite:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    // Méthode helper pour construire l'arbre de dossiers
    buildFolderTree(folders, parentId = null) {
        return folders
            .filter(f => f.parent_id === parentId)
            .map(folder => ({
                ...folder,
                children: this.buildFolderTree(folders, folder.id)
            }));
    }
}

module.exports = new LibraryController();
