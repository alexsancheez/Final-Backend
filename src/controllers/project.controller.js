import Project from "../models/Project.js";
import Client from "../models/Client.js";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";

export const createProject = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.company) {
      return next(AppError.badRequest("El usuario no tiene empresa asignada"));
    }

    const client = await Client.findOne({
      _id: req.body.client,
      company: user.company,
      deleted: false,
    });
    if (!client) {
      return next(AppError.notFound("Cliente no encontrado en esta empresa"));
    }

    const existing = await Project.findOne({
      projectCode: req.body.projectCode,
      company: user.company,
      deleted: false,
    });
    if (existing) {
      return next(AppError.conflict("Ya existe un proyecto con ese codigo"));
    }

    const project = await Project.create({
      ...req.body,
      user: req.user.id,
      company: user.company,
    });

    const io = req.app.get("io");
    if (io) {
      io.to(user.company.toString()).emit("project:new", project);
    }

    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.company) {
      return next(AppError.badRequest("El usuario no tiene empresa asignada"));
    }

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, company: user.company, deleted: false },
      req.body,
      { new: true }
    );

    if (!project) {
      return next(AppError.notFound("Proyecto no encontrado"));
    }

    res.json(project);
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.company) {
      return next(AppError.badRequest("El usuario no tiene empresa asignada"));
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { company: user.company, deleted: false };

    if (req.query.client) filter.client = req.query.client;
    if (req.query.name) filter.name = { $regex: req.query.name, $options: "i" };
    if (req.query.active !== undefined) filter.active = req.query.active === "true";

    const sort = req.query.sort || "-createdAt";

    const [projects, totalItems] = await Promise.all([
      Project.find(filter).populate("client", "name cif").sort(sort).skip(skip).limit(limit),
      Project.countDocuments(filter),
    ]);

    res.json({
      data: projects,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page,
    });
  } catch (error) {
    next(error);
  }
};

export const getProject = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.company) {
      return next(AppError.badRequest("El usuario no tiene empresa asignada"));
    }

    const project = await Project.findOne({
      _id: req.params.id,
      company: user.company,
      deleted: false,
    }).populate("client", "name cif");

    if (!project) {
      return next(AppError.notFound("Proyecto no encontrado"));
    }

    res.json(project);
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.company) {
      return next(AppError.badRequest("El usuario no tiene empresa asignada"));
    }

    const isSoft = req.query.soft === "true";

    if (isSoft) {
      const project = await Project.findOneAndUpdate(
        { _id: req.params.id, company: user.company },
        { deleted: true },
        { new: true }
      );
      if (!project) {
        return next(AppError.notFound("Proyecto no encontrado"));
      }
      return res.json({ message: "Proyecto archivado correctamente" });
    }

    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      company: user.company,
    });
    if (!project) {
      return next(AppError.notFound("Proyecto no encontrado"));
    }

    res.json({ message: "Proyecto eliminado correctamente" });
  } catch (error) {
    next(error);
  }
};

export const getArchivedProjects = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.company) {
      return next(AppError.badRequest("El usuario no tiene empresa asignada"));
    }

    const projects = await Project.find({ company: user.company, deleted: true });

    res.json(projects);
  } catch (error) {
    next(error);
  }
};

export const restoreProject = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.company) {
      return next(AppError.badRequest("El usuario no tiene empresa asignada"));
    }

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, company: user.company, deleted: true },
      { deleted: false },
      { new: true }
    );

    if (!project) {
      return next(AppError.notFound("Proyecto archivado no encontrado"));
    }

    res.json(project);
  } catch (error) {
    next(error);
  }
};
