/**
 * Quality Control Controller
 * Records inspections and updates manufacturing batch defective counts
 */
const QualityControl = require('../models/QualityControl');
const Manufacturing = require('../models/Manufacturing');
const { qcSchema } = require('../validators/validators');

/**
 * POST /qc/add
 * Add a quality control inspection record
 * Integration: Updates batch defective_count on failure
 */
exports.addInspection = async (req, res) => {
  try {
    const { error, value } = qcSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Verify batch exists
    const batch = await Manufacturing.findById(value.batch_id);
    if (!batch) {
      return res.status(404).json({ message: 'Manufacturing batch not found.' });
    }

    // Add inspector info
    value.inspected_by = req.user._id;

    const inspection = await QualityControl.create(value);

    // Integration: If failed, increment defective count on batch
    if (value.inspection_result === 'Fail') {
      const defectCount = value.defects ? value.defects.length : 1;
      await Manufacturing.findByIdAndUpdate(value.batch_id, {
        $inc: { defective_count: defectCount }
      });
    }

    await inspection.populate(['batch_id', 'inspected_by']);

    res.status(201).json({ message: 'Inspection recorded successfully', inspection });
  } catch (error) {
    console.error('Add inspection error:', error);
    res.status(500).json({ message: 'Server error recording inspection.' });
  }
};

/**
 * GET /qc/report
 * Get all quality control inspection reports
 */
exports.getReport = async (req, res) => {
  try {
    const reports = await QualityControl.find()
      .populate('batch_id', 'batch_id product_name quantity stage status defective_count')
      .populate('inspected_by', 'name email')
      .sort({ createdAt: -1 });

    // Summary stats
    const totalInspections = reports.length;
    const passed = reports.filter(r => r.inspection_result === 'Pass').length;
    const failed = reports.filter(r => r.inspection_result === 'Fail').length;

    res.json({
      summary: {
        total: totalInspections,
        passed,
        failed,
        passRate: totalInspections ? ((passed / totalInspections) * 100).toFixed(1) + '%' : '0%'
      },
      reports
    });
  } catch (error) {
    console.error('Get QC report error:', error);
    res.status(500).json({ message: 'Server error fetching QC reports.' });
  }
};
