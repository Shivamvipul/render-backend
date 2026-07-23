const Category = require('../models/Category');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError, sendSuccess } = require('../utils/apiResponse');

const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort('name');
  sendSuccess(res, 200, 'Categories fetched', categories);
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, description, icon } = req.body;
  const slug = name.toLowerCase().trim().replace(/\s+/g, '-');
  const category = await Category.create({ name, slug, description, icon });
  sendSuccess(res, 201, 'Category created', category);
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!category) throw new ApiError(404, 'Category not found');
  sendSuccess(res, 200, 'Category updated', category);
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!category) throw new ApiError(404, 'Category not found');
  sendSuccess(res, 200, 'Category deactivated', category);
});

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
