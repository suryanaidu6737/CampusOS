import { Institution } from '../models/Institution.js';

export const getInstitutionSettings = async (req, res) => {
  try {
    let institution = null;
    if (req.user?.institutionId) {
      institution = await Institution.findById(req.user.institutionId);
    }
    if (!institution) {
      institution = await Institution.findOne({});
    }

    if (!institution) {
      return res.status(404).json({ success: false, message: 'No institution found' });
    }

    res.json({
      success: true,
      settings: {
        id: institution._id,
        name: institution.name,
        code: institution.code,
        emailDomain: institution.emailDomain,
        address: institution.address,
        logo: institution.logo,
        isActive: institution.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateInstitutionSettings = async (req, res) => {
  try {
    const { name, code, emailDomain, address } = req.body;
    let institution = null;

    if (req.user?.institutionId) {
      institution = await Institution.findById(req.user.institutionId);
    }
    if (!institution) {
      institution = await Institution.findOne({});
    }

    if (!institution) {
      return res.status(404).json({ success: false, message: 'No institution found' });
    }

    if (name) institution.name = name;
    if (code) institution.code = code;
    if (emailDomain) institution.emailDomain = emailDomain;
    if (address !== undefined) institution.address = address;

    await institution.save();

    res.json({
      success: true,
      message: 'Institution settings updated successfully',
      settings: {
        id: institution._id,
        name: institution.name,
        code: institution.code,
        emailDomain: institution.emailDomain,
        address: institution.address,
        logo: institution.logo,
        isActive: institution.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
