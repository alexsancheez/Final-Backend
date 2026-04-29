import DeliveryNote from "../models/DeliveryNote.js";
import Project from "../models/Project.js";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import cloudinaryService from "../services/cloudinary.service.js";
import { generatePdfBuffer, sendPdfResponse } from "../services/pdf.service.js";
import sharp from "sharp";

export const createDeliveryNote = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.company) {
      return next(AppError.badRequest("El usuario no tiene empresa asignada"));
    }

    const project = await Project.findOne({
      _id: req.body.project,
      company: user.company,
      deleted: false,
    });
    if (!project) {
      return next(AppError.notFound("Proyecto no encontrado en esta empresa"));
    }

    const note = await DeliveryNote.create({
      ...req.body,
      user: req.user.id,
      company: user.company,
    });

    const io = req.app.get("io");
    if (io) {
      io.to(user.company.toString()).emit("deliverynote:new", note);
    }

    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
};

export const getDeliveryNotes = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.company) {
      return next(AppError.badRequest("El usuario no tiene empresa asignada"));
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { company: user.company, deleted: false };

    if (req.query.project) filter.project = req.query.project;
    if (req.query.client) filter.client = req.query.client;
    if (req.query.format) filter.format = req.query.format;
    if (req.query.signed !== undefined) filter.signed = req.query.signed === "true";
    if (req.query.from || req.query.to) {
      filter.workDate = {};
      if (req.query.from) filter.workDate.$gte = new Date(req.query.from);
      if (req.query.to) filter.workDate.$lte = new Date(req.query.to);
    }

    const sort = req.query.sort || "-workDate";

    const [notes, totalItems] = await Promise.all([
      DeliveryNote.find(filter)
        .populate("client", "name")
        .populate("project", "name projectCode")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      DeliveryNote.countDocuments(filter),
    ]);

    res.json({
      data: notes,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page,
    });
  } catch (error) {
    next(error);
  }
};

export const getDeliveryNote = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.company) {
      return next(AppError.badRequest("El usuario no tiene empresa asignada"));
    }

    const note = await DeliveryNote.findOne({
      _id: req.params.id,
      company: user.company,
      deleted: false,
    })
      .populate("user", "name lastName email")
      .populate("client", "name cif email address")
      .populate("project", "name projectCode address")
      .populate("company", "name cif address");

    if (!note) {
      return next(AppError.notFound("Albaran no encontrado"));
    }

    res.json(note);
  } catch (error) {
    next(error);
  }
};

export const downloadPdf = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.company) {
      return next(AppError.badRequest("El usuario no tiene empresa asignada"));
    }

    const note = await DeliveryNote.findOne({
      _id: req.params.id,
      company: user.company,
      deleted: false,
    })
      .populate("user", "name lastName email")
      .populate("client", "name cif email address")
      .populate("project", "name projectCode address")
      .populate("company", "name cif address");

    if (!note) {
      return next(AppError.notFound("Albaran no encontrado"));
    }

    if (note.signed && note.pdfUrl) {
      return res.redirect(note.pdfUrl);
    }

    await sendPdfResponse(note, res);
  } catch (error) {
    next(error);
  }
};

export const signDeliveryNote = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.company) {
      return next(AppError.badRequest("El usuario no tiene empresa asignada"));
    }

    if (!req.file) {
      return next(AppError.badRequest("Se requiere la imagen de la firma"));
    }

    const note = await DeliveryNote.findOne({
      _id: req.params.id,
      company: user.company,
      deleted: false,
    });

    if (!note) {
      return next(AppError.notFound("Albaran no encontrado"));
    }

    if (note.signed) {
      return next(AppError.badRequest("El albaran ya esta firmado"));
    }

    const optimizedBuffer = await sharp(req.file.buffer)
      .resize(800)
      .webp({ quality: 80 })
      .toBuffer();

    const signatureResult = await cloudinaryService.uploadBuffer(optimizedBuffer, {
      folder: "bildyapp/signatures",
    });

    note.signed = true;
    note.signedAt = new Date();
    note.signatureUrl = signatureResult.secure_url;
    await note.save();

    const populatedNote = await DeliveryNote.findById(note._id)
      .populate("user", "name lastName email")
      .populate("client", "name cif email address")
      .populate("project", "name projectCode address")
      .populate("company", "name cif address");

    const pdfBuffer = await generatePdfBuffer(populatedNote);

    const pdfResult = await cloudinaryService.uploadBuffer(pdfBuffer, {
      folder: "bildyapp/pdfs",
      resourceType: "raw",
    });

    note.pdfUrl = pdfResult.secure_url;
    await note.save();

    const io = req.app.get("io");
    if (io) {
      io.to(user.company.toString()).emit("deliverynote:signed", note);
    }

    res.json(note);
  } catch (error) {
    next(error);
  }
};

export const deleteDeliveryNote = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.company) {
      return next(AppError.badRequest("El usuario no tiene empresa asignada"));
    }

    const note = await DeliveryNote.findOne({
      _id: req.params.id,
      company: user.company,
    });

    if (!note) {
      return next(AppError.notFound("Albaran no encontrado"));
    }

    if (note.signed) {
      return next(AppError.badRequest("No se puede eliminar un albaran firmado"));
    }

    await note.deleteOne();

    res.json({ message: "Albaran eliminado correctamente" });
  } catch (error) {
    next(error);
  }
};
