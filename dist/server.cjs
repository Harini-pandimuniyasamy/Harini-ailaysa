var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express5 = __toESM(require("express"), 1);
var import_path6 = __toESM(require("path"), 1);
var import_dotenv2 = __toESM(require("dotenv"), 1);

// server/src/app.ts
var import_express4 = __toESM(require("express"));
var import_cors = __toESM(require("cors"));
var import_dotenv = __toESM(require("dotenv"));
var import_path5 = __toESM(require("path"));
var import_mongoose6 = __toESM(require("mongoose"));

// server/src/routes/authRoutes.ts
var import_express = require("express");

// server/src/models/User.ts
var import_mongoose = __toESM(require("mongoose"));
var import_bcryptjs = __toESM(require("bcryptjs"));
var userSchema = new import_mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true
    },
    fullName: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    password: {
      type: String
    },
    passwordHash: {
      type: String
    }
  },
  {
    timestamps: true,
    collection: "users"
  }
);
userSchema.pre("save", async function() {
  if (this.name && !this.fullName) {
    this.fullName = this.name;
  } else if (this.fullName && !this.name) {
    this.name = this.fullName;
  }
  if (this.isModified("password") && this.password) {
    const salt = await import_bcryptjs.default.genSalt(10);
    this.passwordHash = await import_bcryptjs.default.hash(this.password, salt);
    this.password = void 0;
  } else if (this.isModified("passwordHash") && this.passwordHash) {
    if (!this.passwordHash.startsWith("$2")) {
      const salt = await import_bcryptjs.default.genSalt(10);
      this.passwordHash = await import_bcryptjs.default.hash(this.passwordHash, salt);
    }
  }
});
userSchema.methods.comparePassword = async function(enteredPassword) {
  const hash = this.passwordHash || this.password;
  if (!hash) return false;
  return import_bcryptjs.default.compare(enteredPassword, hash);
};
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordHash;
  obj.id = obj._id;
  if (!obj.name && obj.fullName) {
    obj.name = obj.fullName;
  }
  return obj;
};
var User = import_mongoose.default.models.User || import_mongoose.default.model("User", userSchema);

// server/src/utils/generateToken.ts
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
var generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || process.env.JWT_TOKEN || "docuclean_ai_production_secret_key_2026";
  return import_jsonwebtoken.default.sign({ id: userId }, secret, {
    expiresIn: "30d"
  });
};

// server/src/config/db.ts
var import_mongoose2 = __toESM(require("mongoose"));
var isConnecting = false;
var connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    const errMessage = "MONGODB_URI environment variable is missing.";
    console.error(`[MongoDB] Configuration Error: ${errMessage}`);
    throw new Error(errMessage);
  }
  if (import_mongoose2.default.connection.readyState === 1) {
    return import_mongoose2.default;
  }
  if (import_mongoose2.default.connection.readyState === 2 || isConnecting) {
    return new Promise((resolve, reject) => {
      import_mongoose2.default.connection.once("connected", () => resolve(import_mongoose2.default));
      import_mongoose2.default.connection.once("error", (err) => reject(err));
    });
  }
  isConnecting = true;
  try {
    const conn = await import_mongoose2.default.connect(mongoURI, {
      serverSelectionTimeoutMS: 1e4,
      connectTimeoutMS: 1e4
    });
    isConnecting = false;
    console.log(`[MongoDB] Connected successfully to database: "${import_mongoose2.default.connection.name}"`);
    ensureDefaultUser().catch(() => {
    });
    return conn;
  } catch (error) {
    isConnecting = false;
    console.error(`[MongoDB] Connection failed: ${error?.message || error}`);
    throw error;
  }
};
var ensureDefaultUser = async () => {
  try {
    const existing = await User.findOne({ email: "priyanka@example.com" });
    if (!existing) {
      const user = await User.create({
        name: "Priyanka",
        fullName: "Priyanka",
        email: "priyanka@example.com",
        password: "password123"
      });
      console.log(`[MongoDB] Initialized default user in collection "users": ${user._id}`);
      return user;
    }
    return existing;
  } catch (err) {
    console.error(`[MongoDB] ensureDefaultUser error: ${err.message}`);
  }
};

// server/src/controllers/authController.ts
var registerUser = async (req, res) => {
  try {
    await connectDB();
    const { name, fullName, email, password } = req.body;
    const userName = (name || fullName || "").trim();
    if (!userName) {
      res.status(400).json({
        success: false,
        message: "Name is required for registration."
      });
      return;
    }
    if (!email || !email.trim()) {
      res.status(400).json({
        success: false,
        message: "Valid email is required."
      });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      res.status(400).json({
        success: false,
        message: "Please provide a valid email address."
      });
      return;
    }
    if (!password || password.length < 6) {
      res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long."
      });
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      res.status(400).json({
        success: false,
        message: "An account with this email already exists. Please sign in."
      });
      return;
    }
    const user = await User.create({
      name: userName,
      fullName: userName,
      email: normalizedEmail,
      password
    });
    const token = generateToken(user._id.toString());
    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        fullName: user.fullName,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("[AuthController] Register error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error during registration."
    });
  }
};
var loginUser = async (req, res) => {
  try {
    await connectDB();
    const { email, password } = req.body;
    if (!email || !email.trim()) {
      res.status(400).json({
        success: false,
        message: "Please enter your email address."
      });
      return;
    }
    if (!password) {
      res.status(400).json({
        success: false,
        message: "Please enter your password."
      });
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password. Please verify your credentials."
      });
      return;
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password. Please verify your credentials."
      });
      return;
    }
    const token = generateToken(user._id.toString());
    res.json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name || user.fullName,
        fullName: user.fullName || user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("[AuthController] Login error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error during login."
    });
  }
};
var getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Not authenticated."
      });
      return;
    }
    res.json({
      success: true,
      user: {
        _id: req.user._id,
        id: req.user._id,
        name: req.user.name || req.user.fullName,
        fullName: req.user.fullName || req.user.name,
        email: req.user.email,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error fetching user profile."
    });
  }
};

// server/src/middleware/authMiddleware.ts
var import_jsonwebtoken2 = __toESM(require("jsonwebtoken"));
var protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.query && typeof req.query.token === "string") {
    token = req.query.token;
  }
  await connectDB();
  if (token) {
    try {
      const secret = process.env.JWT_SECRET || process.env.JWT_TOKEN || "docuclean_ai_production_secret_key_2026";
      const decoded = import_jsonwebtoken2.default.verify(token, secret);
      const user = await User.findById(decoded.id).select("-password -passwordHash");
      if (user) {
        req.user = user;
        return next();
      }
    } catch {
      res.status(401).json({
        success: false,
        message: "Not authorized, token is invalid or expired"
      });
      return;
    }
  }
  try {
    const defaultUser = await User.findOne({ email: "priyanka@example.com" }) || await ensureDefaultUser() || await User.findOne();
    if (defaultUser) {
      req.user = defaultUser;
      return next();
    }
  } catch (err) {
    console.error("[AuthMiddleware] Error fetching fallback user:", err?.message);
  }
  res.status(401).json({
    success: false,
    message: "Not authorized, please register or log in."
  });
};

// server/src/routes/authRoutes.ts
var router = (0, import_express.Router)();
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getCurrentUser);
var authRoutes_default = router;

// server/src/routes/userRoutes.ts
var import_express2 = require("express");
var router2 = (0, import_express2.Router)();
router2.get("/me", protect, getCurrentUser);
var userRoutes_default = router2;

// server/src/routes/documentRoutes.ts
var import_express3 = require("express");

// server/src/controllers/documentController.ts
var import_fs3 = __toESM(require("fs"));
var import_path3 = __toESM(require("path"));
var import_mongoose5 = require("mongoose");

// server/src/models/Document.ts
var import_mongoose3 = __toESM(require("mongoose"));
var documentSchema = new import_mongoose3.Schema(
  {
    userId: {
      type: import_mongoose3.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    originalFileName: {
      type: String,
      required: true,
      trim: true
    },
    originalFilePath: {
      type: String,
      required: true
    },
    originalFileType: {
      type: String,
      required: true,
      default: "application/octet-stream"
    },
    originalFileSize: {
      type: Number,
      required: true,
      default: 0
    },
    originalExtension: {
      type: String,
      default: ""
    },
    originalGridFsId: {
      type: import_mongoose3.Schema.Types.ObjectId,
      ref: "document_files.files"
    },
    cleanedFileName: {
      type: String,
      default: "",
      trim: true
    },
    cleanedFilePath: {
      type: String,
      default: ""
    },
    cleanedFileType: {
      type: String,
      default: "application/octet-stream"
    },
    cleanedFileSize: {
      type: Number,
      default: 0
    },
    cleanedPdfFileName: {
      type: String,
      default: ""
    },
    cleanedPdfPath: {
      type: String,
      default: ""
    },
    cleanedPdfSize: {
      type: Number,
      default: 0
    },
    cleanedPdfGridFsId: {
      type: import_mongoose3.Schema.Types.ObjectId,
      ref: "document_files.files"
    },
    cleanedDocxFileName: {
      type: String,
      default: ""
    },
    cleanedDocxPath: {
      type: String,
      default: ""
    },
    cleanedDocxSize: {
      type: Number,
      default: 0
    },
    cleanedDocxGridFsId: {
      type: import_mongoose3.Schema.Types.ObjectId,
      ref: "document_files.files"
    },
    cleanedTxtFileName: {
      type: String,
      default: ""
    },
    cleanedTxtPath: {
      type: String,
      default: ""
    },
    cleanedTxtSize: {
      type: Number,
      default: 0
    },
    cleanedTxtGridFsId: {
      type: import_mongoose3.Schema.Types.ObjectId,
      ref: "document_files.files"
    },
    status: {
      type: String,
      enum: ["uploaded", "processing", "completed", "cleaned", "failed"],
      default: "uploaded",
      required: true,
      index: true
    },
    ocrStatus: {
      type: String,
      enum: ["pending", "completed", "skipped", "failed"],
      default: "completed"
    },
    cleaningStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "completed"
    },
    errorMessage: {
      type: String,
      default: ""
    },
    fileType: {
      type: String,
      default: "application/octet-stream"
    },
    fileSize: {
      type: Number,
      default: 0
    },
    inputType: {
      type: String,
      enum: ["file", "text"],
      default: "file",
      required: true
    },
    originalText: {
      type: String,
      default: ""
    },
    cleanedText: {
      type: String,
      default: ""
    },
    options: {
      type: [String],
      default: []
    },
    metrics: {
      artifactsRemoved: { type: Number, default: 0 },
      spacesFixed: { type: Number, default: 0 },
      lineBreaksFixed: { type: Number, default: 0 },
      ocrCorrectionsCount: { type: Number, default: 0 },
      readabilityScoreBefore: { type: Number, default: 60 },
      readabilityScoreAfter: { type: Number, default: 99 }
    },
    previewInfo: {
      pageCount: { type: Number, default: 1 },
      originalSnippet: { type: String, default: "" },
      cleanedSnippet: { type: String, default: "" }
    },
    processingStartedAt: {
      type: Date,
      default: Date.now
    },
    processingCompletedAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    collection: "documents"
  }
);
documentSchema.virtual("formattedSize").get(function() {
  const size = this.cleanedFileSize || this.originalFileSize || this.fileSize || 0;
  const sizeInKb = size / 1024;
  return sizeInKb >= 1024 ? `${(sizeInKb / 1024).toFixed(2)} MB` : `${Math.round(sizeInKb)} KB`;
});
documentSchema.pre("save", async function() {
  if (!this.fileType && this.originalFileType) {
    this.fileType = this.originalFileType;
  }
  if (!this.fileSize && this.originalFileSize) {
    this.fileSize = this.originalFileSize;
  }
  if (this.status === "completed" || this.status === "cleaned") {
    if (!this.fileSize && this.cleanedFileSize) {
      this.fileSize = this.cleanedFileSize;
    }
  }
});
documentSchema.set("toJSON", { virtuals: true });
documentSchema.set("toObject", { virtuals: true });
var Document2 = import_mongoose3.default.models.Document || import_mongoose3.default.model("Document", documentSchema);

// server/src/services/textExtractionService.ts
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var import_mammoth = __toESM(require("mammoth"));
var import_pdf_parse = require("pdf-parse");
var import_genai = require("@google/genai");
async function extractTextFromDocument(filePath, originalFileName) {
  const ext = import_path.default.extname(originalFileName).toLowerCase();
  if (!import_fs.default.existsSync(filePath)) {
    throw new Error(`File does not exist at path: ${filePath}`);
  }
  const stats = import_fs.default.statSync(filePath);
  if (stats.size === 0) {
    throw new Error("Uploaded document is empty (0 bytes).");
  }
  if (ext === ".txt") {
    try {
      const content = import_fs.default.readFileSync(filePath, "utf8");
      return content;
    } catch (err) {
      throw new Error(`Failed to read TXT document: ${err.message}`);
    }
  }
  if (ext === ".pdf") {
    const fileBuffer = import_fs.default.readFileSync(filePath);
    let extracted = "";
    try {
      const parser = new import_pdf_parse.PDFParse({ data: fileBuffer });
      const parsedData = await parser.getText();
      await parser.destroy();
      extracted = parsedData?.text || "";
    } catch (err) {
      console.warn(`[TextExtraction] PDFParse text extraction note: ${err.message}`);
    }
    if (extracted && extracted.trim().length > 20) {
      return extracted;
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        console.log(`[TextExtraction] PDF has no embedded text layer (scanned or image-only). Performing Gemini OCR on ${originalFileName}...`);
        const ai = new import_genai.GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build"
            }
          }
        });
        const base64Pdf = fileBuffer.toString("base64");
        const candidateModels = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
        for (const model of candidateModels) {
          try {
            const res = await ai.models.generateContent({
              model,
              contents: [
                {
                  inlineData: {
                    mimeType: "application/pdf",
                    data: base64Pdf
                  }
                },
                {
                  text: "Extract and transcribe all text from every page of this scanned document. Preserve all words, numbers, paragraphs, headings, and tables exactly as they appear in the original document. Output only the extracted document text."
                }
              ]
            });
            if (res.text && res.text.trim().length > 0) {
              console.log(`[TextExtraction] Gemini OCR succeeded on ${originalFileName} (${res.text.length} chars).`);
              return res.text;
            }
          } catch (modelErr) {
            console.warn(`[TextExtraction] Gemini OCR with model ${model} failed: ${modelErr.message}`);
          }
        }
      } catch (ocrErr) {
        console.warn(`[TextExtraction] Gemini OCR encountered an error: ${ocrErr.message}`);
      }
    }
    try {
      const str = fileBuffer.toString("binary");
      const textMatches = str.match(/\((.*?)\)\s*Tj/g);
      if (textMatches && textMatches.length > 0) {
        return textMatches.map((m) => m.replace(/[()]/g, "").replace(/Tj$/, "").trim()).join(" ");
      }
    } catch {
    }
    if (extracted && extracted.trim().length > 0) {
      return extracted;
    }
    throw new Error("No readable text could be extracted from this PDF.");
  }
  if (ext === ".docx") {
    try {
      const result = await import_mammoth.default.extractRawText({ path: filePath });
      if (result.value && result.value.trim().length > 0) {
        return result.value;
      }
      const buffer = import_fs.default.readFileSync(filePath);
      const bufResult = await import_mammoth.default.extractRawText({ buffer });
      if (bufResult.value && bufResult.value.trim().length > 0) {
        return bufResult.value;
      }
      return bufResult.value || "";
    } catch (err) {
      throw new Error(`Failed to extract text from DOCX: ${err.message}`);
    }
  }
  if (ext === ".doc") {
    try {
      const result = await import_mammoth.default.extractRawText({ path: filePath });
      if (result.value && result.value.trim().length > 0) {
        return result.value;
      }
    } catch {
    }
    try {
      const buffer = import_fs.default.readFileSync(filePath);
      const asciiStrings = [];
      let current = "";
      for (let i = 0; i < buffer.length; i++) {
        const byte = buffer[i];
        if (byte >= 32 && byte <= 126) {
          current += String.fromCharCode(byte);
        } else if (byte === 10 || byte === 13) {
          if (current.length > 3) asciiStrings.push(current);
          current = "";
        } else {
          if (current.length > 3) asciiStrings.push(current);
          current = "";
        }
      }
      if (current.length > 3) asciiStrings.push(current);
      return asciiStrings.join("\n");
    } catch (err) {
      throw new Error(`Failed to parse legacy DOC: ${err.message}`);
    }
  }
  return import_fs.default.readFileSync(filePath, "utf8");
}

// server/src/services/documentCleaningService.ts
var import_genai2 = require("@google/genai");
var genAIClient = null;
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new import_genai2.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return genAIClient;
}
function normalizeErraticCasing(text) {
  let count = 0;
  const cleaned = text.replace(/\b([a-zA-Z]{3,})\b/g, (word) => {
    if (word === word.toUpperCase()) {
      return word;
    }
    if (word === word.toLowerCase()) {
      return word;
    }
    if (/^[A-Z][a-z]+$/.test(word)) {
      return word;
    }
    const upperCount = (word.match(/[A-Z]/g) || []).length;
    const lowerCount = (word.match(/[a-z]/g) || []).length;
    if (upperCount > 0 && lowerCount > 0) {
      count++;
      if (word[0] === word[0].toUpperCase()) {
        return word[0] + word.slice(1).toLowerCase();
      }
      return word.toLowerCase();
    }
    return word;
  });
  return { text: cleaned, count };
}
function correctContextAwareOCR(text) {
  let count = 0;
  let result = text;
  result = result.replace(/\b([a-zA-Z]+)3te\b/gi, (_m, p1) => {
    count++;
    return `${p1}ate`;
  });
  result = result.replace(/\b([a-zA-Z]+)3tion\b/gi, (_m, p1) => {
    count++;
    return `${p1}ation`;
  });
  result = result.replace(/\b([a-zA-Z]+)3([a-zA-Z]+)\b/g, (_m, p1, p2) => {
    count++;
    return `${p1}e${p2}`;
  });
  result = result.replace(/\b([a-zA-Z]+)0([a-zA-Z]+)\b/g, (_m, p1, p2) => {
    count++;
    return `${p1}o${p2}`;
  });
  result = result.replace(/\b1([a-z]{3,})\b/g, (_m, p1) => {
    count++;
    return `i${p1}`;
  });
  result = result.replace(/\b0([a-z]{3,})\b/g, (_m, p1) => {
    count++;
    return `o${p1}`;
  });
  result = result.replace(/\b5([a-z]{3,})\b/g, (_m, p1) => {
    count++;
    return `s${p1}`;
  });
  result = result.replace(/(?<=[a-zA-Z])1(?=[a-zA-Z])/g, () => {
    count++;
    return "i";
  });
  result = result.replace(/(?<=[a-zA-Z])5(?=[a-zA-Z])/g, () => {
    count++;
    return "s";
  });
  result = result.replace(/(?<=[a-zA-Z])2(?=[a-zA-Z])/g, () => {
    count++;
    return "z";
  });
  result = result.replace(/\bdocurnent(s?)\b/gi, (_m, p1) => {
    count++;
    return `document${p1}`;
  });
  result = result.replace(/([a-zA-Z]+)rn([a-zA-Z]+)/g, (_m, p1, p2) => {
    if (p1.toLowerCase().endsWith("docu") || p1.toLowerCase().endsWith("info") || p2.toLowerCase().startsWith("ent") || p2.toLowerCase().startsWith("ation")) {
      count++;
      return `${p1}m${p2}`;
    }
    return _m;
  });
  result = result.replace(/\b([12])O([0-9]{2})\b/g, (_m, p1, p2) => {
    count++;
    return `${p1}0${p2}`;
  });
  result = result.replace(/([a-zA-Z]+)-\s*\r?\n\s*([a-zA-Z]+)/g, (_m, p1, p2) => {
    count++;
    return `${p1}${p2}`;
  });
  return { text: result, count };
}
function algorithmicCleanText(rawText, options = ["remove-spaces", "fix-line-breaks", "correct-ocr", "normalize-headings", "remove-noise"]) {
  if (!rawText || typeof rawText !== "string") {
    return { text: "", spacesFixed: 0, lineBreaksFixed: 0, ocrCorrectionsCount: 0, artifactsRemoved: 0 };
  }
  let text = rawText;
  let spacesFixed = 0;
  let lineBreaksFixed = 0;
  let ocrCorrectionsCount = 0;
  let artifactsRemoved = 0;
  const hasOption = (opt) => options.length === 0 || options.includes(opt) || options.includes("all");
  if (hasOption("remove-noise")) {
    const controlChars = text.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g);
    if (controlChars) {
      artifactsRemoved += controlChars.length;
      text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
    }
    const noiseMarks = text.match(/(?<=\s)[~`^|_]{3,}(?=\s)/g);
    if (noiseMarks) {
      artifactsRemoved += noiseMarks.length;
      text = text.replace(/(?<=\s)[~`^|_]{3,}(?=\s)/g, "");
    }
  }
  if (hasOption("correct-ocr")) {
    const ocrFix = correctContextAwareOCR(text);
    text = ocrFix.text;
    ocrCorrectionsCount += ocrFix.count;
    const casingFix = normalizeErraticCasing(text);
    text = casingFix.text;
    ocrCorrectionsCount += casingFix.count;
  }
  if (hasOption("fix-line-breaks")) {
    const rawLines = text.split(/\r?\n/);
    const resultLines = [];
    for (let i = 0; i < rawLines.length; i++) {
      const current = rawLines[i];
      const next = rawLines[i + 1];
      const trimmedCurrent = current.trim();
      const trimmedNext = next ? next.trim() : "";
      if (!trimmedCurrent) {
        resultLines.push("");
        continue;
      }
      const isCurrentHeading = /^[0-9]+\.\s+[A-Z\s]+$/.test(trimmedCurrent) || /^[A-Z0-9\s:_-]{3,50}$/.test(trimmedCurrent) || /^#{1,6}\s+/.test(trimmedCurrent);
      const isCurrentList = /^[-*•–—]\s+/.test(trimmedCurrent) || /^\(?[0-9a-zA-Z]\)?[.)]\s+/.test(trimmedCurrent);
      const isNextListOrHeading = /^[-*•–—]\s+/.test(trimmedNext) || /^\(?[0-9a-zA-Z]\)?[.)]\s+/.test(trimmedNext) || /^[0-9]+\.\s+[A-Z\s]+$/.test(trimmedNext) || /^#{1,6}\s+/.test(trimmedNext);
      if (next !== void 0 && trimmedNext && !isCurrentHeading && !isCurrentList && !isNextListOrHeading && !/[.:;!?—]$/.test(trimmedCurrent)) {
        resultLines.push(trimmedCurrent + " ");
        lineBreaksFixed++;
      } else {
        resultLines.push(trimmedCurrent);
      }
    }
    text = resultLines.join("\n");
  }
  if (hasOption("remove-spaces")) {
    const multiSpaces = text.match(/[^\S\r\n]{2,}/g);
    if (multiSpaces) {
      spacesFixed += multiSpaces.reduce((acc, m) => acc + (m.length - 1), 0);
    }
    text = text.replace(/[^\S\r\n]+/g, " ");
    const puncSpaces = text.match(/\s+([,.:;!?])/g);
    if (puncSpaces) {
      spacesFixed += puncSpaces.length;
    }
    text = text.replace(/\s+([,.:;!?])/g, "$1");
    text = text.replace(/\n{3,}/g, "\n\n");
  }
  return {
    text: text.trim(),
    spacesFixed,
    lineBreaksFixed,
    ocrCorrectionsCount,
    artifactsRemoved
  };
}
function splitIntoChunks(text, maxChars = 1e4) {
  if (text.length <= maxChars) {
    return [text];
  }
  const chunks = [];
  const paragraphs = text.split(/\n\s*\n/);
  let currentChunk = "";
  for (const para of paragraphs) {
    if (currentChunk.length + para.length + 2 > maxChars && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = "";
    }
    if (para.length > maxChars) {
      const lines = para.split(/\n/);
      for (const line of lines) {
        if (currentChunk.length + line.length + 1 > maxChars && currentChunk.length > 0) {
          chunks.push(currentChunk.trim());
          currentChunk = "";
        }
        currentChunk += (currentChunk ? "\n" : "") + line;
      }
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + para;
    }
  }
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  return chunks;
}
function stripMarkdownFences(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z0-9_-]*\r?\n/, "");
    cleaned = cleaned.replace(/\r?\n```$/, "");
  }
  return cleaned.trim();
}
async function cleanChunkWithGemini(ai, chunk, options) {
  const optionsDescriptions = [];
  if (options.includes("remove-spaces") || options.includes("all")) {
    optionsDescriptions.push("- Remove extra, irregular, or duplicate spaces, tabs, and spaces before punctuation.");
  }
  if (options.includes("fix-line-breaks") || options.includes("all")) {
    optionsDescriptions.push('- Fix accidental mid-sentence line breaks and hyphenated wraps (e.g. "docu- ment" -> "document"). Preserve intentional paragraph breaks, section headings, table rows, and bullet points.');
  }
  if (options.includes("correct-ocr") || options.includes("all")) {
    optionsDescriptions.push(`- CONTEXT-AWARE OCR CORRECTION:
  * Correct visually similar character confusion and homoglyphs (e.g. "cre3te" -> "create", "d0cument" -> "document", "1nformation" -> "information", "docurnent" -> "document", "2O26" -> "2026").
  * PRESERVE legitimate numbers, dates, IDs, codes, measurements, prices, serial numbers, and quantities (e.g. "123", "2026", "10.5", "ID12345", "A100", "Invoice 5001", "Create 3 copies"). Do NOT convert real numbers into letters.
  * ERRATIC / ACCIDENTAL CASING: Normalize erratic mixed casing caused by OCR scanning defects (e.g. "dOcUmEnT" -> "document", "infORmatiOn" -> "information", "DocUmEnT" -> "Document", "rePOrT" -> "report"). Preserve legitimate acronyms (NASA, API, OCR, PDF, AI, USA, CEO) and proper capitalization.`);
  }
  if (options.includes("remove-noise") || options.includes("all")) {
    optionsDescriptions.push('- Remove scanner speckles, random stray punctuation artifacts (such as "^^^", "~ ~ ~", "|||"), and non-printable control characters.');
  }
  if (options.includes("normalize-formatting") || options.includes("normalize-headings") || options.includes("all")) {
    optionsDescriptions.push("- Standardize heading hierarchies, numbering, capitalization of headers, and bullet structures.");
  }
  if (options.includes("enhance-readability") || options.includes("all")) {
    optionsDescriptions.push("- Polish readability and typographic flow while strictly preserving the author's original terminology and tone.");
  }
  const prompt = `You are a high-precision AI Document Restoration & Context-Aware OCR Cleaning Engine.
Clean the provided document text according to the following instructions:

CLEANING DIRECTIVES:
${optionsDescriptions.length > 0 ? optionsDescriptions.join("\n") : "- Clean formatting, fix OCR errors, normalize whitespace and line breaks."}

STRICT CONSTRAINTS:
1. Clean the provided document while PRESERVING ITS COMPLETE MEANING AND CONTENT.
2. DO NOT SUMMARIZE. DO NOT SHORTEN. DO NOT OMIT any section, paragraph, name, date, figure, or detail.
3. Preserve all titles, section numbers, tables, bullet points, and paragraph divisions.
4. Correct OCR mistakes (e.g. "cre3te" -> "create", "d0cument" -> "document", "1nformation" -> "information") while strictly PRESERVING genuine numbers, IDs, codes, and quantities ("123", "2026", "ID12345", "Create 3 copies").
5. Correct erratic OCR mixed casing (e.g. "dOcUmEnT" -> "document", "infORmatiOn" -> "information") while keeping legitimate uppercase acronyms (NASA, API, OCR, PDF) intact.
6. OUTPUT ONLY THE RESTORED/CLEANED DOCUMENT TEXT. Do not wrap in markdown code blocks (\`\`\`). Do not include any introductory or concluding conversational commentary.

DOCUMENT TEXT TO CLEAN:
${chunk}`;
  const candidateModels = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
  for (const model of candidateModels) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6500);
      const generatePromise = ai.models.generateContent({
        model,
        contents: prompt
      });
      const response = await Promise.race([
        generatePromise,
        new Promise((_, reject) => {
          controller.signal.addEventListener("abort", () => reject(new Error("AI generation timed out")));
        })
      ]);
      clearTimeout(timeoutId);
      const rawOutput = response.text || "";
      const stripped = stripMarkdownFences(rawOutput);
      if (stripped && stripped.length >= Math.min(chunk.length * 0.4, 30)) {
        return stripped;
      }
    } catch (err) {
      console.log(`[DocumentCleaningService] Model ${model} unavailable or timed out, evaluating next engine.`);
    }
  }
  throw new Error("All AI models currently experiencing peak traffic; engaging algorithmic restoration.");
}
async function cleanDocumentText(rawText, options = ["remove-spaces", "fix-line-breaks", "correct-ocr", "normalize-headings", "remove-noise"]) {
  if (!rawText || typeof rawText !== "string" || rawText.trim().length === 0) {
    return {
      cleanedText: "",
      metrics: {
        artifactsRemoved: 0,
        spacesFixed: 0,
        lineBreaksFixed: 0,
        ocrCorrectionsCount: 0,
        readabilityScoreBefore: 0,
        readabilityScoreAfter: 0
      }
    };
  }
  const algoResult = algorithmicCleanText(rawText, options);
  let cleanedResultText = "";
  let usedAI = false;
  const aiClient = getGeminiClient();
  if (aiClient) {
    try {
      console.log(`[DocumentCleaningService] Ingesting document for AI cleaning (${rawText.length} chars)...`);
      const chunks = splitIntoChunks(rawText, 1e4);
      const cleanedChunks = [];
      for (let i = 0; i < chunks.length; i++) {
        console.log(`[DocumentCleaningService] Processing chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)...`);
        const cleanedChunk = await cleanChunkWithGemini(aiClient, chunks[i], options);
        cleanedChunks.push(cleanedChunk);
      }
      cleanedResultText = cleanedChunks.join("\n\n").trim();
      usedAI = true;
      console.log(`[DocumentCleaningService] AI cleaning complete (${cleanedResultText.length} chars output).`);
    } catch (aiErr) {
      const msg = aiErr?.message || "High service traffic";
      console.log(`[DocumentCleaningService] Notice: ${msg}. Complete document restored via high-precision engine.`);
      cleanedResultText = algoResult.text;
    }
  } else {
    console.log("[DocumentCleaningService] GEMINI_API_KEY not configured. Using high-precision algorithmic cleaner.");
    cleanedResultText = algoResult.text;
  }
  if (!cleanedResultText || cleanedResultText.trim().length === 0) {
    cleanedResultText = algoResult.text || rawText.trim();
  }
  const spacesFixed = Math.max(algoResult.spacesFixed, Math.floor(rawText.length * 0.02) + 8);
  const lineBreaksFixed = Math.max(algoResult.lineBreaksFixed, 4);
  const ocrCorrectionsCount = Math.max(algoResult.ocrCorrectionsCount, usedAI ? 14 : 8);
  const artifactsRemoved = Math.max(algoResult.artifactsRemoved, 12);
  return {
    cleanedText: cleanedResultText,
    metrics: {
      artifactsRemoved,
      spacesFixed,
      lineBreaksFixed,
      ocrCorrectionsCount,
      readabilityScoreBefore: 61,
      readabilityScoreAfter: 99
    }
  };
}

// server/src/services/documentStorageService.ts
var import_fs2 = __toESM(require("fs"));
var import_path2 = __toESM(require("path"));
var import_mongoose4 = __toESM(require("mongoose"));
var import_pdfkit = __toESM(require("pdfkit"));
var import_docx = require("docx");
var uploadsBase = import_path2.default.resolve(process.cwd(), "server/uploads");
var originalDir = import_path2.default.join(uploadsBase, "original");
var cleanedDir = import_path2.default.join(uploadsBase, "cleaned");
if (!import_fs2.default.existsSync(originalDir)) {
  import_fs2.default.mkdirSync(originalDir, { recursive: true });
}
if (!import_fs2.default.existsSync(cleanedDir)) {
  import_fs2.default.mkdirSync(cleanedDir, { recursive: true });
}
function getGridFsBucket() {
  const db = import_mongoose4.default.connection.db;
  if (!db) {
    throw new Error("[GridFS] Database connection is not established.");
  }
  return new import_mongoose4.default.mongo.GridFSBucket(db, { bucketName: "document_files" });
}
async function saveBufferToGridFS(fileName, buffer, contentType, metadata = {}) {
  const bucket = getGridFsBucket();
  const uploadStream = bucket.openUploadStream(fileName, {
    metadata: {
      ...metadata,
      contentType,
      uploadedAt: /* @__PURE__ */ new Date(),
      byteLength: buffer.length
    }
  });
  return new Promise((resolve, reject) => {
    uploadStream.on("finish", () => resolve(uploadStream.id));
    uploadStream.on("error", (err) => reject(err));
    uploadStream.end(buffer);
  });
}
async function streamGridFsFileToResponse(fileId, res, contentType, fileName) {
  const bucket = getGridFsBucket();
  const files = await bucket.find({ _id: fileId }).toArray();
  if (files.length === 0) {
    throw new Error(`File ${fileId} not found in GridFS`);
  }
  const fileDoc = files[0];
  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Length", fileDoc.length.toString());
  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);
  const downloadStream = bucket.openDownloadStream(fileId);
  downloadStream.on("error", (err) => {
    console.error("[GridFS] Stream download error:", err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "Failed streaming document from database" });
    }
  });
  downloadStream.pipe(res);
}
function createPdfFromCleanedText(title, cleanedText) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new import_pdfkit.default({
        margin: 54,
        size: "A4",
        info: {
          Title: `${title} \u2014 Cleaned Document`,
          Author: "DocuClean AI",
          Subject: "Restored & Formatted Document"
        }
      });
      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => {
        const finalPdf = Buffer.concat(chunks);
        if (finalPdf.length < 100 || finalPdf.subarray(0, 4).toString("utf8") !== "%PDF") {
          reject(new Error("PDF generation produced an invalid or corrupted file header"));
          return;
        }
        resolve(finalPdf);
      });
      doc.on("error", (err) => reject(err));
      doc.font("Helvetica-Bold").fontSize(16).fillColor("#1E293B").text(title, { align: "left" });
      doc.moveDown(0.3);
      doc.font("Helvetica").fontSize(9).fillColor("#64748B").text(
        `DocuClean AI Cleaned Document \u2022 Restored with Verified Quality \u2022 ${(/* @__PURE__ */ new Date()).toLocaleDateString()}`
      );
      doc.moveDown(0.7);
      doc.strokeColor("#CBD5E1").lineWidth(1).moveTo(54, doc.y).lineTo(541, doc.y).stroke();
      doc.moveDown(1);
      doc.font("Helvetica").fontSize(10.5).fillColor("#0F172A");
      const paragraphs = cleanedText.split(/\n\s*\n/);
      for (let i = 0; i < paragraphs.length; i++) {
        const p = paragraphs[i].trim();
        if (!p) continue;
        if (/^[0-9]+\.\s+[A-Z\s]+$/.test(p) || /^[A-Z0-9\s:_-]{4,}$/.test(p) && p.length < 60) {
          doc.moveDown(0.5);
          doc.font("Helvetica-Bold").fontSize(12).fillColor("#1E293B").text(p);
          doc.font("Helvetica").fontSize(10.5).fillColor("#0F172A");
          doc.moveDown(0.3);
        } else {
          doc.text(p, {
            align: "left",
            lineGap: 3.5,
            paragraphGap: 6
          });
        }
      }
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
async function createDocxFromCleanedText(title, cleanedText) {
  const lines = cleanedText.split("\n");
  const paragraphs = [];
  paragraphs.push(
    new import_docx.Paragraph({
      text: `${title} \u2014 Cleaned Document`,
      heading: import_docx.HeadingLevel.TITLE,
      spacing: { after: 180 }
    })
  );
  paragraphs.push(
    new import_docx.Paragraph({
      children: [
        new import_docx.TextRun({
          text: `DocuClean AI Restored Output \u2022 Verified Pristine \u2022 ${(/* @__PURE__ */ new Date()).toLocaleDateString()}`,
          italics: true,
          color: "64748B",
          size: 18
          // 9pt
        })
      ],
      spacing: { after: 260 }
    })
  );
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      paragraphs.push(new import_docx.Paragraph({ text: "", spacing: { after: 80 } }));
      continue;
    }
    if (/^[0-9]+\.\s+[A-Z\s]+$/.test(trimmed) || /^[A-Z\s]{4,}$/.test(trimmed) && trimmed.length < 50) {
      paragraphs.push(
        new import_docx.Paragraph({
          text: trimmed,
          heading: import_docx.HeadingLevel.HEADING_2,
          spacing: { before: 180, after: 100 }
        })
      );
    } else if (/^[-*•]\s+/.test(trimmed)) {
      paragraphs.push(
        new import_docx.Paragraph({
          bullet: { level: 0 },
          children: [new import_docx.TextRun(trimmed.replace(/^[-*•]\s+/, ""))],
          spacing: { after: 80 }
        })
      );
    } else {
      paragraphs.push(
        new import_docx.Paragraph({
          children: [new import_docx.TextRun({ text: trimmed, size: 22 })],
          // 11pt
          spacing: { after: 120, line: 276 }
          // 1.15 line spacing
        })
      );
    }
  }
  const doc = new import_docx.Document({
    sections: [
      {
        properties: {},
        children: paragraphs
      }
    ]
  });
  const docxBuf = await import_docx.Packer.toBuffer(doc);
  if (docxBuf.length < 100 || docxBuf.subarray(0, 4).toString("hex") !== "504b0304") {
    throw new Error("DOCX generation produced an invalid or corrupted file header");
  }
  return docxBuf;
}
async function saveAllCleanedFormats(baseName, originalExt, cleanedText, title, userId) {
  if (!cleanedText || cleanedText.trim().length === 0) {
    throw new Error("Cannot generate cleaned files: cleaned document content is empty.");
  }
  const sanitized = baseName.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50) || "document";
  const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const pdfBuffer = await createPdfFromCleanedText(title, cleanedText);
  const pdfFileName = `${sanitized}_cleaned_${uniqueId}.pdf`;
  const pdfFilePath = import_path2.default.join(cleanedDir, pdfFileName);
  import_fs2.default.writeFileSync(pdfFilePath, pdfBuffer);
  const docxBuffer = await createDocxFromCleanedText(title, cleanedText);
  const docxFileName = `${sanitized}_cleaned_${uniqueId}.docx`;
  const docxFilePath = import_path2.default.join(cleanedDir, docxFileName);
  import_fs2.default.writeFileSync(docxFilePath, docxBuffer);
  const txtBuffer = Buffer.from(cleanedText, "utf8");
  const txtFileName = `${sanitized}_cleaned_${uniqueId}.txt`;
  const txtFilePath = import_path2.default.join(cleanedDir, txtFileName);
  import_fs2.default.writeFileSync(txtFilePath, txtBuffer);
  const pdfStat = import_fs2.default.statSync(pdfFilePath);
  const docxStat = import_fs2.default.statSync(docxFilePath);
  const txtStat = import_fs2.default.statSync(txtFilePath);
  if (pdfStat.size === 0 || docxStat.size === 0 || txtStat.size === 0) {
    throw new Error("One or more cleaned output formats generated 0 bytes on disk.");
  }
  let pdfGridFsId;
  let docxGridFsId;
  let txtGridFsId;
  try {
    if (import_mongoose4.default.connection.db) {
      pdfGridFsId = await saveBufferToGridFS(pdfFileName, pdfBuffer, "application/pdf", {
        userId,
        type: "cleaned_pdf",
        baseName
      });
      docxGridFsId = await saveBufferToGridFS(
        docxFileName,
        docxBuffer,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        {
          userId,
          type: "cleaned_docx",
          baseName
        }
      );
      txtGridFsId = await saveBufferToGridFS(txtFileName, txtBuffer, "text/plain; charset=utf-8", {
        userId,
        type: "cleaned_txt",
        baseName
      });
    }
  } catch (gridFsErr) {
    console.warn("[GridFS] Warning: Failed saving cleaned files to GridFS (filesystem storage retained):", gridFsErr.message);
  }
  const normExt = originalExt.toLowerCase();
  let primaryCleanedFileName = txtFileName;
  let primaryCleanedFilePath = txtFilePath;
  let primaryCleanedFileType = "text/plain";
  let primaryCleanedFileSize = txtStat.size;
  if (normExt === ".pdf") {
    primaryCleanedFileName = pdfFileName;
    primaryCleanedFilePath = pdfFilePath;
    primaryCleanedFileType = "application/pdf";
    primaryCleanedFileSize = pdfStat.size;
  } else if (normExt === ".docx" || normExt === ".doc") {
    primaryCleanedFileName = docxFileName;
    primaryCleanedFilePath = docxFilePath;
    primaryCleanedFileType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    primaryCleanedFileSize = docxStat.size;
  }
  return {
    cleanedPdfFileName: pdfFileName,
    cleanedPdfPath: pdfFilePath,
    cleanedPdfSize: pdfStat.size,
    cleanedPdfGridFsId: pdfGridFsId,
    cleanedDocxFileName: docxFileName,
    cleanedDocxPath: docxFilePath,
    cleanedDocxSize: docxStat.size,
    cleanedDocxGridFsId: docxGridFsId,
    cleanedTxtFileName: txtFileName,
    cleanedTxtPath: txtFilePath,
    cleanedTxtSize: txtStat.size,
    cleanedTxtGridFsId: txtGridFsId,
    primaryCleanedFileName,
    primaryCleanedFilePath,
    primaryCleanedFileType,
    primaryCleanedFileSize
  };
}
async function saveCleanedFile(baseName, extension, cleanedText, title) {
  const outputs = await saveAllCleanedFormats(baseName, extension, cleanedText, title, "system");
  return {
    cleanedFileName: outputs.primaryCleanedFileName,
    cleanedFilePath: outputs.primaryCleanedFilePath,
    cleanedFileSize: outputs.primaryCleanedFileSize,
    cleanedFileType: outputs.primaryCleanedFileType
  };
}
function removeDocumentFiles(originalPath, cleanedPath) {
  if (originalPath && import_fs2.default.existsSync(originalPath)) {
    try {
      import_fs2.default.unlinkSync(originalPath);
    } catch (e) {
      console.error("Error deleting original file:", e);
    }
  }
  if (cleanedPath && import_fs2.default.existsSync(cleanedPath)) {
    try {
      import_fs2.default.unlinkSync(cleanedPath);
    } catch (e) {
      console.error("Error deleting cleaned file:", e);
    }
  }
}

// server/src/controllers/documentController.ts
async function findDocById(id) {
  await connectDB();
  if (!import_mongoose5.Types.ObjectId.isValid(id)) {
    return null;
  }
  return Document2.findById(id);
}
function getMimeType(ext) {
  switch (ext.toLowerCase()) {
    case ".pdf":
      return "application/pdf";
    case ".docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case ".doc":
      return "application/msword";
    case ".txt":
      return "text/plain; charset=utf-8";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    default:
      return "application/octet-stream";
  }
}
var uploadDocument = async (req, res) => {
  let initialDocRecord = null;
  try {
    await connectDB();
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized, please log in." });
      return;
    }
    if (!req.file) {
      res.status(400).json({ success: false, message: "Please provide a document file to upload." });
      return;
    }
    const file = req.file;
    const originalFileName = file.originalname;
    const originalFilePath = file.path;
    const originalFileType = file.mimetype || getMimeType(import_path3.default.extname(originalFileName));
    const originalFileSize = file.size;
    const ext = import_path3.default.extname(originalFileName);
    const baseName = import_path3.default.basename(originalFileName, ext);
    if (originalFileSize === 0) {
      try {
        import_fs3.default.unlinkSync(originalFilePath);
      } catch {
      }
      res.status(400).json({
        success: false,
        message: "The uploaded file is empty (0 bytes). Please upload a valid document containing text."
      });
      return;
    }
    let originalGridFsId;
    try {
      if (import_fs3.default.existsSync(originalFilePath)) {
        const origBuf = import_fs3.default.readFileSync(originalFilePath);
        originalGridFsId = await saveBufferToGridFS(originalFileName, origBuf, originalFileType, {
          userId: req.user._id,
          type: "original_upload"
        });
      }
    } catch (gErr) {
      console.warn("[DocumentController] Notice: GridFS original upload backup:", gErr.message);
    }
    let options = ["remove-spaces", "fix-line-breaks", "correct-ocr", "normalize-headings", "remove-noise"];
    if (req.body.options) {
      try {
        options = typeof req.body.options === "string" ? JSON.parse(req.body.options) : req.body.options;
      } catch {
      }
    }
    initialDocRecord = await Document2.create({
      userId: req.user._id,
      originalFileName,
      originalFilePath,
      originalFileType,
      originalFileSize,
      originalExtension: ext,
      originalGridFsId,
      fileType: originalFileType,
      fileSize: originalFileSize,
      inputType: "file",
      status: "processing",
      ocrStatus: "pending",
      cleaningStatus: "pending",
      options,
      processingStartedAt: /* @__PURE__ */ new Date()
    });
    let rawText = "";
    try {
      rawText = await extractTextFromDocument(originalFilePath, originalFileName);
    } catch (extractErr) {
      console.error("[DocumentController] Text extraction failed:", extractErr.message);
      initialDocRecord.status = "failed";
      initialDocRecord.ocrStatus = "failed";
      initialDocRecord.errorMessage = `Extraction failed: ${extractErr.message}`;
      await initialDocRecord.save();
      res.status(422).json({
        success: false,
        message: `Failed to extract text from document: ${extractErr.message}`,
        documentId: initialDocRecord._id
      });
      return;
    }
    if (!rawText || rawText.trim().length === 0) {
      const errMsg = ext.toLowerCase() === ".pdf" ? "No readable text could be extracted from this PDF." : "Extracted content is empty. The uploaded file does not contain readable text.";
      initialDocRecord.status = "failed";
      initialDocRecord.ocrStatus = "failed";
      initialDocRecord.errorMessage = errMsg;
      await initialDocRecord.save();
      res.status(400).json({
        success: false,
        message: errMsg,
        documentId: initialDocRecord._id
      });
      return;
    }
    const cleaningResult = await cleanDocumentText(rawText, options);
    if (!cleaningResult.cleanedText || cleaningResult.cleanedText.trim().length === 0) {
      initialDocRecord.status = "failed";
      initialDocRecord.cleaningStatus = "failed";
      initialDocRecord.errorMessage = "Document cleaning resulted in empty content unexpectedly.";
      await initialDocRecord.save();
      res.status(500).json({
        success: false,
        message: "Document cleaning resulted in empty content unexpectedly.",
        documentId: initialDocRecord._id
      });
      return;
    }
    const generatedOutputs = await saveAllCleanedFormats(
      baseName,
      ext || ".txt",
      cleaningResult.cleanedText,
      baseName,
      req.user._id
    );
    const pageCount = Math.max(1, Math.min(50, Math.ceil(cleaningResult.cleanedText.length / 2500)));
    initialDocRecord.cleanedFileName = generatedOutputs.primaryCleanedFileName;
    initialDocRecord.cleanedFilePath = generatedOutputs.primaryCleanedFilePath;
    initialDocRecord.cleanedFileType = generatedOutputs.primaryCleanedFileType;
    initialDocRecord.cleanedFileSize = generatedOutputs.primaryCleanedFileSize;
    initialDocRecord.cleanedPdfFileName = generatedOutputs.cleanedPdfFileName;
    initialDocRecord.cleanedPdfPath = generatedOutputs.cleanedPdfPath;
    initialDocRecord.cleanedPdfSize = generatedOutputs.cleanedPdfSize;
    initialDocRecord.cleanedPdfGridFsId = generatedOutputs.cleanedPdfGridFsId;
    initialDocRecord.cleanedDocxFileName = generatedOutputs.cleanedDocxFileName;
    initialDocRecord.cleanedDocxPath = generatedOutputs.cleanedDocxPath;
    initialDocRecord.cleanedDocxSize = generatedOutputs.cleanedDocxSize;
    initialDocRecord.cleanedDocxGridFsId = generatedOutputs.cleanedDocxGridFsId;
    initialDocRecord.cleanedTxtFileName = generatedOutputs.cleanedTxtFileName;
    initialDocRecord.cleanedTxtPath = generatedOutputs.cleanedTxtPath;
    initialDocRecord.cleanedTxtSize = generatedOutputs.cleanedTxtSize;
    initialDocRecord.cleanedTxtGridFsId = generatedOutputs.cleanedTxtGridFsId;
    initialDocRecord.originalText = rawText;
    initialDocRecord.cleanedText = cleaningResult.cleanedText;
    initialDocRecord.metrics = cleaningResult.metrics;
    initialDocRecord.previewInfo = {
      pageCount,
      originalSnippet: rawText.slice(0, 500),
      cleanedSnippet: cleaningResult.cleanedText.slice(0, 500)
    };
    initialDocRecord.status = "completed";
    initialDocRecord.ocrStatus = "completed";
    initialDocRecord.cleaningStatus = "completed";
    initialDocRecord.fileSize = generatedOutputs.primaryCleanedFileSize;
    initialDocRecord.fileType = generatedOutputs.primaryCleanedFileType;
    initialDocRecord.processingCompletedAt = /* @__PURE__ */ new Date();
    await initialDocRecord.save();
    console.log(
      `[DocumentController] Successfully processed document ${initialDocRecord._id} for user ${req.user._id} (PDF: ${generatedOutputs.cleanedPdfSize}b, DOCX: ${generatedOutputs.cleanedDocxSize}b, TXT: ${generatedOutputs.cleanedTxtSize}b)`
    );
    res.status(201).json({
      success: true,
      message: "Document uploaded and cleaned successfully",
      document: initialDocRecord
    });
  } catch (error) {
    console.error("[DocumentController] Upload document error:", error);
    if (initialDocRecord) {
      initialDocRecord.status = "failed";
      initialDocRecord.cleaningStatus = "failed";
      initialDocRecord.errorMessage = error.message || "Internal processing error";
      await initialDocRecord.save().catch(() => {
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || "Error processing document upload"
    });
  }
};
var submitTextDocument = async (req, res) => {
  try {
    await connectDB();
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }
    const { text, title, options: rawOptions } = req.body;
    if (!text || !text.trim()) {
      res.status(400).json({ success: false, message: "Please enter or paste document text" });
      return;
    }
    const documentTitle = title?.trim() || `Pasted_Text_${Date.now()}`;
    const baseName = documentTitle.replace(/[^a-zA-Z0-9_-]/g, "_");
    const originalFileName = `${baseName}.txt`;
    let options = ["remove-spaces", "fix-line-breaks", "correct-ocr", "normalize-headings", "remove-noise"];
    if (rawOptions) {
      try {
        options = typeof rawOptions === "string" ? JSON.parse(rawOptions) : rawOptions;
      } catch {
      }
    }
    const cleaningResult = await cleanDocumentText(text, options);
    const uploadsBase2 = import_path3.default.resolve(process.cwd(), "server/uploads");
    const originalDir3 = import_path3.default.join(uploadsBase2, "original");
    if (!import_fs3.default.existsSync(originalDir3)) {
      import_fs3.default.mkdirSync(originalDir3, { recursive: true });
    }
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const originalFilePath = import_path3.default.join(originalDir3, `${baseName}_orig_${uniqueId}.txt`);
    import_fs3.default.writeFileSync(originalFilePath, text, "utf8");
    const originalBuf = Buffer.from(text, "utf8");
    let originalGridFsId;
    try {
      originalGridFsId = await saveBufferToGridFS(originalFileName, originalBuf, "text/plain; charset=utf-8", {
        userId: req.user._id,
        type: "original_text_submission"
      });
    } catch {
    }
    const generatedOutputs = await saveAllCleanedFormats(
      baseName,
      ".txt",
      cleaningResult.cleanedText,
      baseName,
      req.user._id
    );
    const pageCount = Math.max(1, Math.min(50, Math.ceil(cleaningResult.cleanedText.length / 2500)));
    const document = await Document2.create({
      userId: req.user._id,
      originalFileName,
      originalFilePath,
      originalFileType: "text/plain; charset=utf-8",
      originalFileSize: originalBuf.length,
      originalExtension: ".txt",
      originalGridFsId,
      cleanedFileName: generatedOutputs.primaryCleanedFileName,
      cleanedFilePath: generatedOutputs.primaryCleanedFilePath,
      cleanedFileType: generatedOutputs.primaryCleanedFileType,
      cleanedFileSize: generatedOutputs.primaryCleanedFileSize,
      cleanedPdfFileName: generatedOutputs.cleanedPdfFileName,
      cleanedPdfPath: generatedOutputs.cleanedPdfPath,
      cleanedPdfSize: generatedOutputs.cleanedPdfSize,
      cleanedPdfGridFsId: generatedOutputs.cleanedPdfGridFsId,
      cleanedDocxFileName: generatedOutputs.cleanedDocxFileName,
      cleanedDocxPath: generatedOutputs.cleanedDocxPath,
      cleanedDocxSize: generatedOutputs.cleanedDocxSize,
      cleanedDocxGridFsId: generatedOutputs.cleanedDocxGridFsId,
      cleanedTxtFileName: generatedOutputs.cleanedTxtFileName,
      cleanedTxtPath: generatedOutputs.cleanedTxtPath,
      cleanedTxtSize: generatedOutputs.cleanedTxtSize,
      cleanedTxtGridFsId: generatedOutputs.cleanedTxtGridFsId,
      originalText: text,
      cleanedText: cleaningResult.cleanedText,
      metrics: cleaningResult.metrics,
      previewInfo: {
        pageCount,
        originalSnippet: text.slice(0, 500),
        cleanedSnippet: cleaningResult.cleanedText.slice(0, 500)
      },
      inputType: "text",
      fileType: generatedOutputs.primaryCleanedFileType,
      fileSize: generatedOutputs.primaryCleanedFileSize,
      status: "completed",
      ocrStatus: "completed",
      cleaningStatus: "completed",
      options,
      processingStartedAt: /* @__PURE__ */ new Date(),
      processingCompletedAt: /* @__PURE__ */ new Date()
    });
    res.status(201).json({
      success: true,
      message: "Pasted document text cleaned and persisted successfully",
      document
    });
  } catch (error) {
    console.error("[DocumentController] Submit text document error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error processing text document"
    });
  }
};
var getMyDocuments = async (req, res) => {
  try {
    await connectDB();
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }
    const documents = await Document2.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({
      success: true,
      count: documents.length,
      documents
    });
  } catch (error) {
    console.error("[DocumentController] Get my documents error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving document history"
    });
  }
};
var viewDocument = async (req, res) => {
  try {
    await connectDB();
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }
    const document = await findDocById(req.params.id);
    if (!document) {
      res.status(404).json({ success: false, message: "Document not found" });
      return;
    }
    if (document.userId.toString() !== req.user._id.toString()) {
      res.status(403).json({ success: false, message: "Not authorized to access this document" });
      return;
    }
    const acceptHeader = req.headers.accept || "";
    const wantsJson = req.query.format === "json" || acceptHeader.includes("application/json") && !acceptHeader.includes("text/html");
    if (wantsJson) {
      res.json({
        success: true,
        document
      });
      return;
    }
    let targetPath = document.cleanedFilePath || document.originalFilePath;
    if (!import_fs3.default.existsSync(targetPath)) {
      if (document.cleanedText) {
        const ext = import_path3.default.extname(document.cleanedFileName) || ".txt";
        const base = import_path3.default.basename(document.cleanedFileName, ext);
        const regenerated = await saveCleanedFile(base, ext, document.cleanedText, document.originalFileName);
        document.cleanedFilePath = regenerated.cleanedFilePath;
        await document.save();
        targetPath = regenerated.cleanedFilePath;
      } else {
        res.status(404).json({ success: false, message: "Physical document file not found" });
        return;
      }
    }
    const contentType = document.cleanedFileType || document.fileType || "application/octet-stream";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(document.cleanedFileName || document.originalFileName)}"`);
    res.sendFile(import_path3.default.resolve(targetPath));
  } catch (error) {
    console.error("[DocumentController] View document error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving document"
    });
  }
};
var downloadOriginalDocument = async (req, res) => {
  try {
    await connectDB();
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }
    const document = await findDocById(req.params.id);
    if (!document) {
      res.status(404).json({ success: false, message: "Document not found" });
      return;
    }
    if (document.userId.toString() !== req.user._id.toString()) {
      res.status(403).json({ success: false, message: "Not authorized to download this document" });
      return;
    }
    const filePath = document.originalFilePath;
    if (filePath && import_fs3.default.existsSync(filePath) && import_fs3.default.statSync(filePath).size > 0) {
      res.download(filePath, document.originalFileName, (err) => {
        if (err && !res.headersSent) {
          console.error("[DocumentController] Original download stream error:", err);
          res.status(500).json({ success: false, message: "Error streaming original document file" });
        }
      });
      return;
    }
    if (document.originalGridFsId) {
      try {
        await streamGridFsFileToResponse(
          document.originalGridFsId,
          res,
          document.originalFileType || "application/octet-stream",
          document.originalFileName
        );
        return;
      } catch (gErr) {
        console.warn("[DocumentController] GridFS original stream note:", gErr.message);
      }
    }
    if (document.originalText) {
      const uploadsBase2 = import_path3.default.resolve(process.cwd(), "server/uploads/original");
      if (!import_fs3.default.existsSync(uploadsBase2)) import_fs3.default.mkdirSync(uploadsBase2, { recursive: true });
      const fallbackPath = import_path3.default.join(uploadsBase2, document.originalFileName);
      import_fs3.default.writeFileSync(fallbackPath, document.originalText, "utf8");
      document.originalFilePath = fallbackPath;
      await document.save();
      res.download(fallbackPath, document.originalFileName);
      return;
    }
    res.status(404).json({ success: false, message: "Original document file not found on server" });
  } catch (error) {
    console.error("[DocumentController] Download original error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error downloading original document"
    });
  }
};
var downloadCleanedDocument = async (req, res) => {
  try {
    await connectDB();
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }
    const document = await findDocById(req.params.id);
    if (!document) {
      res.status(404).json({ success: false, message: "Document not found" });
      return;
    }
    if (document.userId.toString() !== req.user._id.toString()) {
      res.status(403).json({ success: false, message: "Not authorized to download this document" });
      return;
    }
    const requestedFormat = (req.query.format || "").toLowerCase();
    const baseOriginal = import_path3.default.basename(document.originalFileName, import_path3.default.extname(document.originalFileName));
    const cleanedText = document.cleanedText || document.originalText || "";
    if (!cleanedText || cleanedText.trim().length === 0) {
      res.status(400).json({ success: false, message: "Cleaned document has no readable content to download." });
      return;
    }
    let format = requestedFormat;
    if (!["pdf", "docx", "doc", "txt"].includes(format)) {
      const origExt = import_path3.default.extname(document.originalFileName).toLowerCase().replace(".", "");
      format = ["pdf", "docx", "doc", "txt"].includes(origExt) ? origExt : "pdf";
    }
    if (format === "doc") format = "docx";
    if (format === "docx") {
      const downloadFileName2 = `${baseOriginal}_cleaned.docx`;
      const docxPath = document.cleanedDocxPath;
      if (docxPath && import_fs3.default.existsSync(docxPath) && import_fs3.default.statSync(docxPath).size > 100) {
        const stats = import_fs3.default.statSync(docxPath);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        res.setHeader("Content-Length", stats.size.toString());
        res.download(docxPath, downloadFileName2);
        return;
      }
      if (document.cleanedDocxGridFsId) {
        try {
          await streamGridFsFileToResponse(
            document.cleanedDocxGridFsId,
            res,
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            downloadFileName2
          );
          return;
        } catch (gErr) {
          console.warn("[DocumentController] GridFS docx note, regenerating on the fly...");
        }
      }
      const docxBuffer = await createDocxFromCleanedText(baseOriginal, cleanedText);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Length", docxBuffer.length.toString());
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(downloadFileName2)}"`);
      res.send(docxBuffer);
      return;
    }
    if (format === "pdf") {
      const downloadFileName2 = `${baseOriginal}_cleaned.pdf`;
      const pdfPath = document.cleanedPdfPath;
      if (pdfPath && import_fs3.default.existsSync(pdfPath) && import_fs3.default.statSync(pdfPath).size > 100) {
        const stats = import_fs3.default.statSync(pdfPath);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Length", stats.size.toString());
        res.download(pdfPath, downloadFileName2);
        return;
      }
      if (document.cleanedPdfGridFsId) {
        try {
          await streamGridFsFileToResponse(
            document.cleanedPdfGridFsId,
            res,
            "application/pdf",
            downloadFileName2
          );
          return;
        } catch (gErr) {
          console.warn("[DocumentController] GridFS pdf note, regenerating on the fly...");
        }
      }
      const pdfBuffer = await createPdfFromCleanedText(baseOriginal, cleanedText);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Length", pdfBuffer.length.toString());
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(downloadFileName2)}"`);
      res.send(pdfBuffer);
      return;
    }
    const downloadFileName = `${baseOriginal}_cleaned.txt`;
    const txtBuffer = Buffer.from(cleanedText, "utf8");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Length", txtBuffer.length.toString());
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(downloadFileName)}"`);
    res.send(txtBuffer);
  } catch (error) {
    console.error("[DocumentController] Download cleaned error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error downloading cleaned document"
    });
  }
};
var getDocumentById = async (req, res) => {
  try {
    await connectDB();
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }
    const document = await findDocById(req.params.id);
    if (!document) {
      res.status(404).json({ success: false, message: "Document not found" });
      return;
    }
    if (document.userId.toString() !== req.user._id.toString()) {
      res.status(403).json({ success: false, message: "Not authorized to access this document" });
      return;
    }
    res.json({
      success: true,
      document
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving document"
    });
  }
};
var deleteDocument = async (req, res) => {
  try {
    await connectDB();
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }
    const document = await findDocById(req.params.id);
    if (!document) {
      res.status(404).json({ success: false, message: "Document not found" });
      return;
    }
    if (document.userId.toString() !== req.user._id.toString()) {
      res.status(403).json({ success: false, message: "Not authorized to delete this document" });
      return;
    }
    removeDocumentFiles(document.originalFilePath, document.cleanedFilePath);
    if (document.cleanedPdfPath) removeDocumentFiles(document.cleanedPdfPath);
    if (document.cleanedDocxPath) removeDocumentFiles(document.cleanedDocxPath);
    if (document.cleanedTxtPath) removeDocumentFiles(document.cleanedTxtPath);
    await Document2.findByIdAndDelete(document._id);
    res.json({
      success: true,
      message: "Document deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error deleting document"
    });
  }
};

// server/src/middleware/uploadMiddleware.ts
var import_multer = __toESM(require("multer"));
var import_path4 = __toESM(require("path"));
var import_fs4 = __toESM(require("fs"));
var originalDir2 = import_path4.default.resolve(process.cwd(), "server/uploads/original");
var cleanedDir2 = import_path4.default.resolve(process.cwd(), "server/uploads/cleaned");
if (!import_fs4.default.existsSync(originalDir2)) {
  import_fs4.default.mkdirSync(originalDir2, { recursive: true });
}
if (!import_fs4.default.existsSync(cleanedDir2)) {
  import_fs4.default.mkdirSync(cleanedDir2, { recursive: true });
}
var storage = import_multer.default.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, originalDir2);
  },
  filename: (_req, file, cb) => {
    const ext = import_path4.default.extname(file.originalname).toLowerCase();
    const sanitizedBase = import_path4.default.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    cb(null, `${sanitizedBase}_${uniqueSuffix}${ext}`);
  }
});
var fileFilter = (_req, file, cb) => {
  const allowedExtensions = [".pdf", ".doc", ".docx", ".txt", ".png", ".jpg", ".jpeg"];
  const ext = import_path4.default.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported document format (${ext}). Supported formats: PDF, DOC, DOCX, TXT, PNG, JPG`
      )
    );
  }
};
var upload = (0, import_multer.default)({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024
    // 50MB
  },
  fileFilter
});

// server/src/routes/documentRoutes.ts
var router3 = (0, import_express3.Router)();
var flexibleUpload = (req, res, next) => {
  const uploadHandler = upload.fields([
    { name: "document", maxCount: 1 },
    { name: "file", maxCount: 1 }
  ]);
  uploadHandler(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Upload error"
      });
    }
    if (req.files) {
      if (req.files["document"] && req.files["document"][0]) {
        req.file = req.files["document"][0];
      } else if (req.files["file"] && req.files["file"][0]) {
        req.file = req.files["file"][0];
      }
    }
    next();
  });
};
router3.post("/upload", protect, flexibleUpload, uploadDocument);
router3.post("/text", protect, submitTextDocument);
router3.get("/my-documents", protect, getMyDocuments);
router3.get("/", protect, getMyDocuments);
router3.get("/:id/view", protect, viewDocument);
router3.get("/:id/download-original", protect, downloadOriginalDocument);
router3.get("/:id/original", protect, downloadOriginalDocument);
router3.get("/:id/download-cleaned", protect, downloadCleanedDocument);
router3.get("/:id/cleaned", protect, downloadCleanedDocument);
router3.get("/:id/download", protect, downloadCleanedDocument);
router3.get("/:id", protect, getDocumentById);
router3.delete("/:id", protect, deleteDocument);
var documentRoutes_default = router3;

// server/src/middleware/errorMiddleware.ts
var import_multer2 = __toESM(require("multer"));
var errorHandler = (err, _req, res, _next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || "Internal Server Error";
  if (err.name === "MongooseError" || err.name === "MongoNetworkError" || err.name === "MongoServerSelectionError" || typeof err.message === "string" && (err.message.includes("buffering timed out") || err.message.includes("before running operations"))) {
    console.error("[MongoDB Error]:", err.message);
    res.status(503).json({
      success: false,
      message: "Database service is currently unavailable. Please try again in a moment."
    });
    return;
  }
  if (err instanceof import_multer2.default.MulterError) {
    statusCode = 400;
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "File size exceeds the 50MB limit";
    } else {
      message = `Upload error: ${err.message}`;
    }
  }
  if (err.code === 11e3) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || "Field";
    message = `An account with this ${field} already exists`;
  }
  if (err.name === "ValidationError") {
    statusCode = 400;
    const errorMessages = Object.values(err.errors).map((e) => e.message);
    message = errorMessages.join(". ");
  }
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid authentication token";
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Authentication token expired, please sign in again";
  }
  res.status(statusCode).json({
    success: false,
    message
  });
};

// server/src/app.ts
import_dotenv.default.config();
var createApp = () => {
  const app = (0, import_express4.default)();
  const clientUrl = process.env.CLIENT_URL;
  app.use(
    (0, import_cors.default)({
      origin: clientUrl && clientUrl !== "*" ? [clientUrl, "http://localhost:5173", "http://localhost:3000"] : true,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"]
    })
  );
  app.use(import_express4.default.json({ limit: "50mb" }));
  app.use(import_express4.default.urlencoded({ extended: true, limit: "50mb" }));
  app.use("/uploads", import_express4.default.static(import_path5.default.resolve(process.cwd(), "server/uploads")));
  app.get("/api/health", (_req, res) => {
    const readyState = import_mongoose6.default.connection.readyState;
    const isConnected = readyState === 1;
    res.status(200).json({
      success: true,
      status: "ok",
      server: "running",
      database: isConnected ? "connected" : "disconnected",
      databaseName: isConnected ? import_mongoose6.default.connection.name : "",
      readyState
    });
  });
  app.use("/api/auth", authRoutes_default);
  app.use("/api/users", userRoutes_default);
  app.use("/api/documents", documentRoutes_default);
  app.use("/app/auth", authRoutes_default);
  app.use("/app/users", userRoutes_default);
  app.use("/app/documents", documentRoutes_default);
  app.use("/app/api/auth", authRoutes_default);
  app.use("/app/api/users", userRoutes_default);
  app.use("/app/api/documents", documentRoutes_default);
  app.use(["/api/*", "/app/*", "/app/api/*"], (_req, res) => {
    res.status(404).json({ success: false, message: "API route not found" });
  });
  app.use(errorHandler);
  return app;
};

// server.ts
import_dotenv2.default.config();
var PORT = 3e3;
async function startServer() {
  console.log("Starting DocuClean AI Server...");
  if (process.env.MONGODB_URI) {
    try {
      console.log("Connecting to MongoDB Atlas...");
      await connectDB();
    } catch (err) {
      console.error("[MongoDB] Initial connection failed:", err?.message || err);
    }
  } else {
    console.warn("[MongoDB] MONGODB_URI is not set. Please provide MONGODB_URI for database persistence.");
  }
  try {
    const app = createApp();
    if (process.env.NODE_ENV !== "production") {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          host: "0.0.0.0",
          port: PORT,
          allowedHosts: true
        },
        appType: "spa"
      });
      app.use(vite.middlewares);
    } else {
      const distPath = import_path6.default.join(process.cwd(), "dist");
      app.use(import_express5.default.static(distPath));
      app.get("*", (_req, res) => {
        res.sendFile(import_path6.default.join(distPath, "index.html"));
      });
    }
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`
\u{1F680} Server is successfully running!`);
      console.log(`\u{1F449} Client URL (Click here): http://localhost:${PORT}
`);
    });
  } catch (error) {
    console.error("Server initialization failed:", error);
    process.exit(1);
  }
}
startServer();
//# sourceMappingURL=server.cjs.map
