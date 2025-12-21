import InsuranceContract from "../models/InsuranceContract.js";

// @desc    Get all insurance contracts
// @route   GET /api/insurance/contracts
// @access  Private (Admin)
export const getAllInsuranceContracts = async (req, res) => {
  try {
    const contracts = await InsuranceContract.find({});
    res.status(200).json(contracts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single insurance contract by ID
// @route   GET /api/insurance/contracts/:id
// @access  Private (Admin)
export const getInsuranceContractById = async (req, res) => {
  try {
    const contract = await InsuranceContract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: "Insurance contract not found" });
    }
    res.status(200).json(contract);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new insurance contract
// @route   POST /api/insurance/contracts
// @access  Private (Admin)
export const createInsuranceContract = async (req, res) => {
  const {
    name,
    code,
    contactPerson,
    phone,
    email,
    contractDate,
    expiryDate,
    status,
    coverage,
    discountRate,
  } = req.body;

  try {
    const newContract = new InsuranceContract({
      name,
      code,
      contactPerson,
      phone,
      email,
      contractDate,
      expiryDate,
      status,
      coverage,
      discountRate,
    });

    const createdContract = await newContract.save();
    res.status(201).json(createdContract);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update an insurance contract
// @route   PUT /api/insurance/contracts/:id
// @access  Private (Admin)
export const updateInsuranceContract = async (req, res) => {
  const {
    name,
    code,
    contactPerson,
    phone,
    email,
    contractDate,
    expiryDate,
    status,
    coverage,
    discountRate,
    lastPaymentDate,
    totalPaidAmount,
  } = req.body;

  try {
    const contract = await InsuranceContract.findById(req.params.id);

    if (contract) {
      contract.name = name || contract.name;
      contract.code = code || contract.code;
      contract.contactPerson = contactPerson || contract.contactPerson;
      contract.phone = phone || contract.phone;
      contract.email = email || contract.email;
      contract.contractDate = contractDate || contract.contractDate;
      contract.expiryDate = expiryDate || contract.expiryDate;
      contract.status = status || contract.status;
      contract.coverage = coverage || contract.coverage;
      contract.discountRate = discountRate || contract.discountRate;
      contract.lastPaymentDate = lastPaymentDate || contract.lastPaymentDate;
      contract.totalPaidAmount = totalPaidAmount || contract.totalPaidAmount;

      const updatedContract = await contract.save();
      res.status(200).json(updatedContract);
    } else {
      res.status(404).json({ message: "Insurance contract not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete an insurance contract
// @route   DELETE /api/insurance/contracts/:id
// @access  Private (Admin)
export const deleteInsuranceContract = async (req, res) => {
  try {
    const contract = await InsuranceContract.findById(req.params.id);

    if (contract) {
      await contract.deleteOne();
      res.status(200).json({ message: "Insurance contract removed" });
    } else {
      res.status(404).json({ message: "Insurance contract not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

