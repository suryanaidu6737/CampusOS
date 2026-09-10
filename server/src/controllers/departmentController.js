import { Department } from '../models/Department.js';

export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({}).populate('headUserId', 'name email');
    res.json({ success: true, count: departments.length, departments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createDepartment = async (req, res) => {
  try {
    const { name, code, description, headUserId } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Name and Code are required' });
    }

    const existing = await Department.findOne({ $or: [{ code: code.toUpperCase() }, { name }] });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Department code or name already exists' });
    }

    const department = await Department.create({
      institutionId: req.user?.institutionId || null,
      name,
      code: code.toUpperCase(),
      description: description || '',
      headUserId: headUserId || null,
    });

    res.status(201).json({ success: true, department });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, headUserId } = req.body;

    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    if (name) department.name = name;
    if (code) department.code = code.toUpperCase();
    if (description !== undefined) department.description = description;
    if (headUserId !== undefined) department.headUserId = headUserId || null;

    await department.save();
    res.json({ success: true, department });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

