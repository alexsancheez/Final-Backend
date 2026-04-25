import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Company from "../models/Company.js";
import config from "../config/index.js";
import AppError from "../utils/AppError.js";
import cloudinaryService from "../services/cloudinary.service.js";
import mailService from "../services/mail.service.js";

const generateTokens = (user) => {
  const payload = { id: user._id, email: user.email, role: user.role };

  const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiry,
  });

  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry,
  });

  return { accessToken, refreshToken };
};

export const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.status === "verified") {
      return next(AppError.conflict("Email ya registrado"));
    }

    if (existingUser) {
      await existingUser.deleteOne();
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const user = await User.create({
      email,
      password: hashedPassword,
      verificationCode,
      verificationAttempts: 3,
    });

    await mailService.sendVerificationEmail(email, verificationCode);

    const tokens = generateTokens(user);

    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.status(201).json({
      user: { email: user.email, status: user.status, role: user.role },
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
};

export const validateEmail = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return next(AppError.notFound("Usuario no encontrado"));
    }

    if (user.verificationAttempts <= 0) {
      return next(AppError.tooManyRequests("Sin intentos de verificacion"));
    }

    if (req.body.code !== user.verificationCode) {
      user.verificationAttempts -= 1;
      await user.save();
      return next(AppError.badRequest("Codigo de verificacion invalido"));
    }

    user.status = "verified";
    await user.save();

    res.json({ message: "Email verificado correctamente" });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return next(AppError.unauthorized("Credenciales invalidas"));
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(AppError.unauthorized("Credenciales invalidas"));
    }

    const tokens = generateTokens(user);

    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.json({
      user: {
        email: user.email,
        status: user.status,
        role: user.role,
        name: user.name,
        lastName: user.lastName,
      },
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePersonalData = async (req, res, next) => {
  try {
    const { name, lastName, nif } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, lastName, nif },
      { new: true }
    ).select("-password -verificationCode -verificationAttempts -refreshToken");

    if (!user) {
      return next(AppError.notFound("Usuario no encontrado"));
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

export const updateCompany = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(AppError.notFound("Usuario no encontrado"));
    }

    let companyData = req.body;

    if (companyData.isFreelance) {
      companyData = {
        name: user.name + " " + user.lastName,
        cif: user.nif,
        address: user.address,
        isFreelance: true,
      };
    }

    const existingCompany = await Company.findOne({ cif: companyData.cif });

    if (existingCompany) {
      user.company = existingCompany._id;
      user.role = "guest";
      await user.save();

      return res.json({ user, company: existingCompany });
    }

    const company = await Company.create({
      ...companyData,
      owner: user._id,
    });

    user.company = company._id;
    await user.save();

    res.status(201).json({ user, company });
  } catch (error) {
    next(error);
  }
};

export const uploadLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(AppError.badRequest("No se ha subido ningun archivo"));
    }

    const user = await User.findById(req.user.id);
    if (!user || !user.company) {
      return next(AppError.badRequest("El usuario no tiene empresa asignada"));
    }

    const result = await cloudinaryService.uploadBuffer(req.file.buffer, {
      folder: "bildyapp/logos",
    });

    const company = await Company.findByIdAndUpdate(
      user.company,
      { logo: result.secure_url },
      { new: true }
    );

    res.json({ company });
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password -verificationCode -verificationAttempts -refreshToken")
      .populate("company");

    if (!user) {
      return next(AppError.notFound("Usuario no encontrado"));
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

export const refreshSession = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(AppError.badRequest("Refresh token requerido"));
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    } catch (err) {
      return next(AppError.unauthorized("Refresh token invalido o expirado"));
    }

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return next(AppError.unauthorized("Refresh token invalido"));
    }

    const tokens = generateTokens(user);

    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.json(tokens);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(AppError.notFound("Usuario no encontrado"));
    }

    user.refreshToken = null;
    await user.save();

    res.json({ message: "Sesion cerrada correctamente" });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const isSoft = req.query.soft === "true";

    if (isSoft) {
      await User.findByIdAndUpdate(req.user.id, { deleted: true });
    } else {
      await User.findByIdAndDelete(req.user.id);
    }

    res.json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    next(error);
  }
};

export const inviteUser = async (req, res, next) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin || !admin.company) {
      return next(AppError.badRequest("El usuario no tiene empresa asignada"));
    }

    const { email, password, name, lastName, nif } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(AppError.conflict("Email ya registrado"));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      lastName,
      nif,
      role: "guest",
      status: "verified",
      company: admin.company,
    });

    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return next(AppError.notFound("Usuario no encontrado"));
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return next(AppError.unauthorized("Contrasena actual incorrecta"));
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Contrasena actualizada correctamente" });
  } catch (error) {
    next(error);
  }
};
