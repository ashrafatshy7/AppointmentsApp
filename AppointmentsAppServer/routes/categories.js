const express = require('express');
const router = express.Router();
const Category = require('../models/category');

/**
 * @openapi
 * /api/categories:
 *   get:
 *     summary: Get all categories
 *     description: Retrieves a list of all categories, sorted by order and name.
 *     responses:
 *       200:
 *         description: A list of categories.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *       500:
 *         description: Failed to fetch categories.
 */
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({})
      .sort({ order: 1, name: 1 })
      .select('name icon description order');
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
});

/**
 * @openapi
 * /api/categories/{id}:
 *   get:
 *     summary: Get a category by ID
 *     description: Retrieves a single category by its unique ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the category to retrieve.
 *     responses:
 *       200:
 *         description: The requested category.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       404:
 *         description: Category not found.
 *       500:
 *         description: Failed to fetch category.
 */
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category'
    });
  }
});

/**
 * @openapi
 * /api/categories:
 *   post:
 *     summary: Create a new category
 *     description: Creates a new category (Admin only).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - icon
 *             properties:
 *               name:
 *                 type: string
 *               icon:
 *                 type: string
 *               description:
 *                 type: string
 *               order:
 *                 type: number
 *     responses:
 *       201:
 *         description: Category created successfully.
 *       400:
 *         description: Missing required fields or category already exists.
 *       500:
 *         description: Failed to create category.
 */
router.post('/', async (req, res) => {
  try {
    const { name, icon, description, order } = req.body;
    
    if (!name || !icon) {
      return res.status(400).json({
        success: false,
        error: 'Name and icon are required'
      });
    }
    
    const category = new Category({
      name,
      icon,
      description,
      order: order || 0
    });
    
    await category.save();
    
    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Category with this name already exists'
      });
    }
    
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create category'
    });
  }
});

/**
 * @openapi
 * /api/categories/{id}:
 *   put:
 *     summary: Update a category
 *     description: Updates an existing category (Admin only).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the category to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               icon:
 *                 type: string
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               order:
 *                 type: number
 *     responses:
 *       200:
 *         description: Category updated successfully.
 *       400:
 *         description: Category with this name already exists.
 *       404:
 *         description: Category not found.
 *       500:
 *         description: Failed to update category.
 */
router.put('/:id', async (req, res) => {
  try {
    const { name, icon, description, isActive, order } = req.body;
    
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, icon, description, isActive, order },
      { new: true, runValidators: true }
    );
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Category with this name already exists'
      });
    }
    
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update category'
    });
  }
});

/**
 * @openapi
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     description: Deletes a category by its ID (Admin only).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the category to delete.
 *     responses:
 *       200:
 *         description: Category deleted successfully.
 *       404:
 *         description: Category not found.
 *       500:
 *         description: Failed to delete category.
 */
router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete category'
    });
  }
});

module.exports = router;
