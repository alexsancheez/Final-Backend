import Client from "../models/Client.js";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";

export const createClient = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.company) {
      return next(AppError.badRequest("El usuario no tiene empresa asignada"));
    }

    const existing = await Client.findOne({
      cif: req.body.cif,
      company: user.company,
      deleted: false,
    });
    if (existing) {
      return next(AppError.conflict("Ya existe un cliente con ese CIF en esta empresa"));
    }

    const client = await Client.create({
      ...req.body,
      user: req.user.id,
      company: user.company,
    });

    const io = req.app.get("io");
    if (io) {
      io.to(user.company.toString()).emit("client:new", client);
    }

    res.status(201).json(client);
  } catch (error) {
    next(error);
  }
};

export const updateClient = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.company) {
      return next(AppError.badRequest("El usuario no tiene empresa asignada"));
    }

    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, company: user.company, deleted: false },
      req.body,
      { new: true }
    );

    if (!client) {
      return next(AppError.notFound("Cliente no encontrado"));
    }

    res.json(client);
  } catch (error) {
    next(error);
  }
};

export const getClients = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.company) {
      return next(AppError.badRequest("El usuario no tiene empresa asignada"));
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { company: user.company, deleted: false };

    if (req.query.name) {
      filter.name = { $regex: req.query.name, $options: "i" };
    }

    const sort = req.query.sort || "-createdAt";

    const [clients, totalItems] = await Promise.all([
      Client.find(filter).sort(sort).skip(skip).limit(limit),
      Client.countDocuments(filter),
    ]);

    res.json({
      data: clients,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page,
    });
  } catch (error) {
    next(error);
  }
};

export const getClient = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.company) {
      return next(AppError.badRequest("El usuario no tiene empresa asignada"));
    }

    const client = await Client.findOne({
      _id: req.params.id,
      company: user.company,
      deleted: false,
    });

    if (!client) {
      return next(AppError.notFound("Cliente no encontrado"));
    }

    res.json(client);
  } catch (error) {
    next(error);
  }
};

export const deleteClient = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.company) {
      return next(AppError.badRequest("El usuario no tiene empresa asignada"));
    }

    const isSoft = req.query.soft === "true";

    if (isSoft) {
      const client = await Client.findOneAndUpdate(
        { _id: req.params.id, company: user.company },
        { deleted: true },
        { new: true }
      );
      if (!client) {
        return next(AppError.notFound("Cliente no encontrado"));
      }
      return res.json({ message: "Cliente archivado correctamente" });
    }

    const client = await Client.findOneAndDelete({
      _id: req.params.id,
      company: user.company,
    });
    if (!client) {
      return next(AppError.notFound("Cliente no encontrado"));
    }

    res.json({ message: "Cliente eliminado correctamente" });
  } catch (error) {
    next(error);
  }
};

export const getArchivedClients = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.company) {
      return next(AppError.badRequest("El usuario no tiene empresa asignada"));
    }

    const clients = await Client.find({ company: user.company, deleted: true });

    res.json(clients);
  } catch (error) {
    next(error);
  }
};

export const restoreClient = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.company) {
      return next(AppError.badRequest("El usuario no tiene empresa asignada"));
    }

    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, company: user.company, deleted: true },
      { deleted: false },
      { new: true }
    );

    if (!client) {
      return next(AppError.notFound("Cliente archivado no encontrado"));
    }

    res.json(client);
  } catch (error) {
    next(error);
  }
};
