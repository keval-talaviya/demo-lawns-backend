  import fs from 'fs';
  import path from 'path';
  import { Command } from 'commander';
  import { camelCase, kebabCase, upperFirst, snakeCase } from 'lodash';

  type Language = 'ts' | 'js';

  interface FieldMeta {
    name: string;
    rawType: string;
    tsType: string;
    jsDocType: string;
    mongooseType: string;
    joiType: string;
    sampleValue: string;
    isPrivate: boolean;
  }

  const program = new Command();

  program
    .requiredOption('--name <name>', 'Module name, e.g., User')
    .option('--fields <fields>', 'Comma separated list of fields: name:string,email:string:private')
    .option('--lite', 'Generate minimal skeleton', false)
    .option('--ts', 'Generate TypeScript files (default)', true)
    .option('--js', 'Generate JavaScript files with JSDoc comments', false)
    .option('--auth', 'Include auth endpoints (register/login/refresh)')
    .option('--mobile', 'Include mobile routes/controllers only')
    .option('--web', 'Include web routes/controllers only')
    .option('--admin', 'Include admin controller file')
    .option('--force', 'Overwrite existing files');

  program.parse(process.argv);

  const options = program.opts();

  const moduleName = String(options.name);
  const modulePascal = upperFirst(camelCase(moduleName));
  const moduleCamel = camelCase(moduleName);
  const moduleSlug = kebabCase(moduleName);
  const moduleSnake = snakeCase(moduleName).toUpperCase();

  const language: Language = options.js ? 'js' : 'ts';
  const extension = language;

  const parseField = (field: string): FieldMeta => {
    const [rawName, rawType = 'string', flag] = field.split(':');
    const name = camelCase(rawName.trim());
    const type = rawType.trim().toLowerCase();
    const isPrivate = (flag || '').toLowerCase() === 'private';

    const tsTypeMap: Record<string, string> = {
      string: 'string',
      number: 'number',
      boolean: 'boolean',
      date: 'Date',
      array: 'unknown[]',
      object: 'Record<string, unknown>',
    };

    const jsDocTypeMap: Record<string, string> = {
      string: 'string',
      number: 'number',
      boolean: 'boolean',
      date: 'Date',
      array: 'Array<unknown>',
      object: 'Object',
    };

    const mongooseTypeMap: Record<string, string> = {
      string: 'String',
      number: 'Number',
      boolean: 'Boolean',
      date: 'Date',
      array: '[Schema.Types.Mixed]',
      object: 'Schema.Types.Mixed',
    };

    const joiTypeMap: Record<string, string> = {
      string: 'Joi.string()',
      number: 'Joi.number()',
      boolean: 'Joi.boolean()',
      date: 'Joi.date()',
      array: 'Joi.array()',
      object: 'Joi.object()',
    };

    const tsType = tsTypeMap[type] ?? 'string';
    const jsDocType = jsDocTypeMap[type] ?? 'string';
    const mongooseType = mongooseTypeMap[type] ?? 'String';
    const joiType = joiTypeMap[type] ?? 'Joi.string()';

    let sampleValue: string;
    switch (type) {
      case 'number':
        sampleValue = '1';
        break;
      case 'boolean':
        sampleValue = 'true';
        break;
      case 'date':
        sampleValue = 'new Date()';
        break;
      case 'array':
        sampleValue = '[]';
        break;
      case 'object':
        sampleValue = '{}';
        break;
      default:
        sampleValue = `'Sample ${modulePascal}'`;
    }

    return {
      name,
      rawType: type,
      tsType,
      jsDocType,
      mongooseType,
      joiType,
      sampleValue,
      isPrivate,
    };
  };

  const fields: FieldMeta[] = options.fields
    ? String(options.fields)
        .split(',')
        .map((field: string) => field.trim())
        .filter(Boolean)
        .map(parseField)
    : [
        parseField('name:string'),
        parseField('description:string'),
      ];

  const ensureDirectories = () => {
    const basePath = path.resolve(process.cwd(), 'src', 'modules', moduleCamel);
    const directories = [
      basePath,
      path.join(basePath, 'model'),
      path.join(basePath, 'routes'),
      path.join(basePath, 'controllers'),
      path.join(basePath, 'interfaces'),
      path.join(basePath, 'services'),
      path.join(basePath, 'validators'),
      path.join(basePath, 'messages'),
      path.join(basePath, 'tests'),
    ];

    directories.forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    return basePath;
  };

  const writeFile = (filePath: string, content: string) => {
    if (!options.force && fs.existsSync(filePath)) {
      console.warn(`Skipped existing file: ${filePath}`);
      return;
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.info(`Created ${filePath}`);
  };

  const generateModel = (): string => {
    if (language === 'js') {
      const schemaFields = fields
        .map((field) => `    ${field.name}: { type: ${field.mongooseType}, required: true },`)
        .join('\n');
      return `const { Schema, model } = require('mongoose');

  /**
   * @typedef {Object} ${modulePascal}Document
  ${fields.map((field) => ` * @property {${field.jsDocType}} ${field.name}${field.isPrivate ? ' - private' : ''}`).join('\n')}
  * @property {Date} createdAt
  * @property {Date} updatedAt
  */

  const ${moduleCamel}Schema = new Schema(
    {
  ${schemaFields}
      isDeleted: { type: Boolean, default: false },
      deletedAt: { type: Date, default: null },
    },
    { timestamps: true },
  );

  module.exports = model('${modulePascal}', ${moduleCamel}Schema);
  `;
    }

    const schemaFields = fields
      .map((field) => `    ${field.name}: { type: ${field.mongooseType}, required: true },`)
      .join('\n');
    const interfaceFields = fields
      .map((field) => `  ${field.name}: ${field.tsType};${field.isPrivate ? ' // private' : ''}`)
      .join('\n');

    return `import { Schema, model, Document } from 'mongoose';
  import { SoftDeleteDocument } from '../../../db/base.dao';

  export interface ${modulePascal}Document extends Document, SoftDeleteDocument {
  ${interfaceFields}
    createdAt: Date;
    updatedAt: Date;
  }

  const ${moduleCamel}Schema = new Schema<${modulePascal}Document>(
    {
  ${schemaFields}
      isDeleted: { type: Boolean, default: false },
      deletedAt: { type: Date, default: null },
    },
    { timestamps: true },
  );

  export const ${modulePascal}Model = model<${modulePascal}Document>('${modulePascal}', ${moduleCamel}Schema);
  `;
  };

  const generateInterface = (): string => {
    if (language === 'js') {
      const fieldsDoc = fields
        .map((field) => ` * @property {${field.jsDocType}} ${field.name}`)
        .join('\n');
      return `/**
  * @typedef {Object} Create${modulePascal}DTO
  ${fieldsDoc}
  */

  /**
   * @typedef {Object} Update${modulePascal}DTO
  ${fields.map((field) => ` * @property {${field.jsDocType}} [${field.name}]`).join('\n')}
  */

  module.exports = {};
  `;
    }

    const createFields = fields.map((field) => `  ${field.name}: ${field.tsType};`).join('\n');
    const updateFields = fields.map((field) => `  ${field.name}?: ${field.tsType};`).join('\n');

    return `export interface Create${modulePascal}DTO {
  ${createFields}
  }

  export interface Update${modulePascal}DTO {
  ${updateFields}
  }

  export interface ${modulePascal}Query {
    page?: number;
    limit?: number;
  }
  `;
  };

  const generateMessage = (): string => {
    if (language === 'js') {
      return `const messages = {
    CREATED: '${modulePascal} created successfully.',
    UPDATED: '${modulePascal} updated successfully.',
    DELETED: '${modulePascal} deleted successfully.',
    LISTED: '${modulePascal} list retrieved successfully.',
  };

  module.exports = { ${moduleSnake}_MESSAGES: messages };
  `;
    }

    return `export const ${moduleSnake}_MESSAGES = {
    CREATED: '${modulePascal} created successfully.',
    UPDATED: '${modulePascal} updated successfully.',
    DELETED: '${modulePascal} deleted successfully.',
    LISTED: '${modulePascal} list retrieved successfully.',
  };
  `;
  };

  const generateService = (): string => {
    if (options.lite) {
      if (language === 'js') {
        return `const { BaseDAO } = require('../../../db/base.dao');
  const ${modulePascal}Model = require('../model/${moduleCamel}.model');

  class ${modulePascal}ServiceClass extends BaseDAO {
    constructor() {
      super(${modulePascal}Model);
    }
    // TODO: implement service methods
  }

  module.exports = new ${modulePascal}ServiceClass();
  `;
      }
      return `import { BaseDAO } from '../../../db/base.dao';
  import { ${modulePascal}Model, ${modulePascal}Document } from '../model/${moduleCamel}.model';
  import { Create${modulePascal}DTO, Update${modulePascal}DTO } from '../interfaces/${moduleCamel}.interface';

  class ${modulePascal}ServiceClass extends BaseDAO<${modulePascal}Document> {
    constructor() {
      super(${modulePascal}Model);
    }
    // TODO: implement service methods
  }

  export const ${modulePascal}Service = new ${modulePascal}ServiceClass();
  `;
    }

    if (language === 'js') {
      return `const { BaseDAO } = require('../../../db/base.dao');
  const ${modulePascal}Model = require('../model/${moduleCamel}.model');

  class ${modulePascal}ServiceClass extends BaseDAO {
    constructor() {
      super(${modulePascal}Model);
    }

    async create${modulePascal}(payload) {
      // TODO: apply domain-specific transforms before persisting
      return this.create(payload);
    }

    async update${modulePascal}(id, payload) {
      return this.updateById(id, payload);
    }
  }

  module.exports = new ${modulePascal}ServiceClass();
  `;
    }

    return `import { BaseDAO } from '../../../db/base.dao';
  import { ${modulePascal}Model, ${modulePascal}Document } from '../model/${moduleCamel}.model';
  import { Create${modulePascal}DTO, Update${modulePascal}DTO } from '../interfaces/${moduleCamel}.interface';

  class ${modulePascal}ServiceClass extends BaseDAO<${modulePascal}Document> {
    constructor() {
      super(${modulePascal}Model);
    }

    async create${modulePascal}(payload: Create${modulePascal}DTO) {
      // TODO: apply domain-specific transforms before persisting
      return this.create(payload as unknown as ${modulePascal}Document);
    }

    async update${modulePascal}(id: string, payload: Update${modulePascal}DTO) {
      return this.updateById(id, payload as unknown as Partial<${modulePascal}Document>);
    }
  }

  export const ${modulePascal}Service = new ${modulePascal}ServiceClass();
  `;
  };

  const generateValidator = (): string => {
    if (options.lite) {
      if (language === 'js') {
        return `const Joi = require('joi');

  module.exports = {};
  `;
      }
      return `import Joi from 'joi';

  export const create${modulePascal}Schema = {};
  `;
    }

    const createFields = fields
      .map((field) => `  ${field.name}: ${field.joiType}.required(),`)
      .join('\n');
    const updateFields = fields.map((field) => `  ${field.name}: ${field.joiType},`).join('\n');

    let authSchemas = '';
    if (options.auth) {
      if (language === 'js') {
        authSchemas = `
  const authLoginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  const authRegisterSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  });
  `;
      } else {
        authSchemas = `
  export const authLoginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  export const authRegisterSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  });
  `;
      }
    }

    if (language === 'js') {
      return `const Joi = require('joi');

  const create${modulePascal}Schema = Joi.object({
  ${createFields}
  });

  const update${modulePascal}Schema = Joi.object({
  ${updateFields}
  });
  ${authSchemas}
  module.exports = {
    create${modulePascal}Schema,
    update${modulePascal}Schema,${options.auth ? '\n  authLoginSchema,\n  authRegisterSchema,' : ''}
  };
  `;
    }

    return `import Joi from 'joi';

  export const create${modulePascal}Schema = Joi.object({
  ${createFields}
  });

  export const update${modulePascal}Schema = Joi.object({
  ${updateFields}
  });
  ${authSchemas}
  `;
  };

  const generateController = (type: 'mobile' | 'web' | 'admin'): string => {
    const controllerName = `${upperFirst(type)}${modulePascal}Controller`;

    if (options.lite) {
      if (language === 'js') {
        return `module.exports = {
    // TODO: Implement ${type} controller handlers
  };
  `;
      }
      return `import { Request, Response } from 'express';

  export const ${controllerName} = {
    // TODO: implement ${type} controller handlers
  };
  `;
    }

    if (type === 'mobile' && options.auth) {
      if (language === 'js') {
        return `const { StatusCodes } = require('http-status-codes');
  const { AuthService } = require('../../auth/services/auth.service');
  const { successResponse, errorResponse } = require('../../../common/response');
  const { ${moduleSnake}_MESSAGES } = require('../messages/message');

  module.exports = {
    async register(req, res) {
      const result = await AuthService.register(req.body);
      res.status(StatusCodes.CREATED);
      return successResponse(res, result, ${moduleSnake}_MESSAGES.CREATED);
    },

    async login(req, res) {
      try {
        const result = await AuthService.login(req.body);
        return successResponse(res, result, ${moduleSnake}_MESSAGES.CREATED);
      } catch (error) {
        return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Invalid credentials', { error });
      }
    },
  };
  `;
      }
      return `import { Request, Response } from 'express';
  import { StatusCodes } from 'http-status-codes';
  import { AuthService } from '../../auth/services/auth.service';
  import { successResponse, errorResponse } from '../../../common/response';
  import { ${moduleSnake}_MESSAGES } from '../messages/message';

  export const ${controllerName} = {
    async register(req: Request, res: Response) {
      const result = await AuthService.register(req.body);
      res.status(StatusCodes.CREATED);
      return successResponse(res, result, ${moduleSnake}_MESSAGES.CREATED);
    },

    async login(req: Request, res: Response) {
      try {
        const result = await AuthService.login(req.body);
        return successResponse(res, result, ${moduleSnake}_MESSAGES.CREATED);
      } catch (error) {
        return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Invalid credentials', { error });
      }
    },
  };
  `;
    }

    if (type === 'mobile') {
      if (language === 'js') {
        return `const { StatusCodes } = require('http-status-codes');
  const ${modulePascal}Service = require('../services/${moduleCamel}.service');
  const { successResponse } = require('../../../common/response');
  const { ${moduleSnake}_MESSAGES } = require('../messages/message');

  module.exports = {
    async create(req, res) {
      const entity = await ${modulePascal}Service.create${modulePascal}(req.body);
      res.status(StatusCodes.CREATED);
      return successResponse(res, entity, ${moduleSnake}_MESSAGES.CREATED);
    },
  };
  `;
      }
      return `import { Request, Response } from 'express';
  import { StatusCodes } from 'http-status-codes';
  import { ${modulePascal}Service } from '../services/${moduleCamel}.service';
  import { successResponse } from '../../../common/response';
  import { ${moduleSnake}_MESSAGES } from '../messages/message';

  export const ${controllerName} = {
    async create(req: Request, res: Response) {
      const entity = await ${modulePascal}Service.create${modulePascal}(req.body);
      res.status(StatusCodes.CREATED);
      return successResponse(res, entity, ${moduleSnake}_MESSAGES.CREATED);
    },
  };
  `;
    }

    if (type === 'web') {
      if (language === 'js') {
        return `const { StatusCodes } = require('http-status-codes');
  const ${modulePascal}Service = require('../services/${moduleCamel}.service');
  const { successResponse } = require('../../../common/response');
  const { ${moduleSnake}_MESSAGES } = require('../messages/message');

  module.exports = {
    async list(req, res) {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 25;
      const result = await ${modulePascal}Service.paginate({}, { page, limit });
      return successResponse(res, result, ${moduleSnake}_MESSAGES.LISTED);
    },

    async update(req, res) {
      const entity = await ${modulePascal}Service.update${modulePascal}(req.params.id, req.body);
      return successResponse(res, entity, ${moduleSnake}_MESSAGES.UPDATED);
    },

    async remove(req, res) {
      await ${modulePascal}Service.deleteById(req.params.id);
      return res.status(StatusCodes.NO_CONTENT).send();
    },
  };
  `;
      }
      return `import { Request, Response } from 'express';
  import { StatusCodes } from 'http-status-codes';
  import { ${modulePascal}Service } from '../services/${moduleCamel}.service';
  import { successResponse } from '../../../common/response';
  import { ${moduleSnake}_MESSAGES } from '../messages/message';

  export const ${controllerName} = {
    async list(req: Request, res: Response) {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 25;
      const result = await ${modulePascal}Service.paginate({}, { page, limit });
      return successResponse(res, result, ${moduleSnake}_MESSAGES.LISTED);
    },

    async update(req: Request, res: Response) {
      const entity = await ${modulePascal}Service.update${modulePascal}(req.params.id, req.body);
      return successResponse(res, entity, ${moduleSnake}_MESSAGES.UPDATED);
    },

    async remove(req: Request, res: Response) {
      await ${modulePascal}Service.deleteById(req.params.id);
      return res.status(StatusCodes.NO_CONTENT).send();
    },
  };
  `;
    }

    if (type === 'admin') {
      if (language === 'js') {
        return `const { successResponse } = require('../../../common/response');

  module.exports = {
    async dashboard(_req, res) {
      return successResponse(res, { message: 'Admin dashboard placeholder' }, 'Admin dashboard');
    },
  };
  `;
      }
      return `import { Request, Response } from 'express';
  import { successResponse } from '../../../common/response';

  export const ${controllerName} = {
    async dashboard(_req: Request, res: Response) {
      return successResponse(res, { message: 'Admin dashboard placeholder' }, 'Admin dashboard');
    },
  };
  `;
    }

    return '';
  };

  const generateRoute = (type: 'mobile' | 'web'): string => {
    const controllerName = `${upperFirst(type)}${modulePascal}Controller`;

    if (type === 'mobile') {
      if (language === 'js') {
        let imports = `const { Router } = require('express');
  const { getModuleRateLimiter, getCustomRateLimiter } = require('../../../common/rateLimiter');
  const { ${controllerName} } = require('../controllers/${type}${modulePascal}.controller');
  `;
        let routes = '';
        if (!options.lite) {
          imports += `const { validatorMiddleware } = require('../../../middlewares/validatorMiddleware');
  const { create${modulePascal}Schema${options.auth ? ', authLoginSchema, authRegisterSchema' : ''} } = require('../validators/${moduleCamel}.validator');
  `;
          if (options.auth) {
            routes = `const authLimiter = getCustomRateLimiter({
    windowMs: 15 * 60_000,
    max: 10,
    message: 'Too many login attempts. Please try again later.',
  });

  router.post('/register', authLimiter, validatorMiddleware(authRegisterSchema), ${controllerName}.register);
  router.post('/login', authLimiter, validatorMiddleware(authLoginSchema), ${controllerName}.login);
  `;
          } else {
            routes = `router.post('/', validatorMiddleware(create${modulePascal}Schema), ${controllerName}.create);
  `;
          }
        }
        return `${imports}
  const router = Router();

  router.use(getModuleRateLimiter('${moduleCamel}-mobile'));

  ${routes}
  module.exports = router;
  `;
      }

      let imports = `import { Router } from 'express';
  import { getModuleRateLimiter, getCustomRateLimiter } from '../../../common/rateLimiter';
  import { ${controllerName} } from '../controllers/${type}${modulePascal}.controller';
  `;
      let routes = '';
      if (!options.lite) {
        imports += `import { validatorMiddleware } from '../../../middlewares/validatorMiddleware';
  import { create${modulePascal}Schema${options.auth ? ', authLoginSchema, authRegisterSchema' : ''} } from '../validators/${moduleCamel}.validator';
  `;
        if (options.auth) {
          routes = `const authLimiter = getCustomRateLimiter({
    windowMs: 15 * 60_000,
    max: 10,
    message: 'Too many login attempts. Please try again later.',
  });

  router.post('/register', authLimiter, validatorMiddleware(authRegisterSchema), ${controllerName}.register);
  router.post('/login', authLimiter, validatorMiddleware(authLoginSchema), ${controllerName}.login);
  `;
        } else {
          routes = `router.post('/', validatorMiddleware(create${modulePascal}Schema), ${controllerName}.create);
  `;
        }
      }
      return `${imports}
  const router = Router();

  router.use(getModuleRateLimiter('${moduleCamel}-mobile'));

  ${routes}
  export default router;
  `;
    }

    if (type === 'web') {
      if (language === 'js') {
        let imports = `const { Router } = require('express');
  const { getModuleRateLimiter } = require('../../../common/rateLimiter');
  const { ${controllerName} } = require('../controllers/${type}${modulePascal}.controller');
  `;
        let routes = '';
        if (!options.lite) {
          imports += `const { validatorMiddleware } = require('../../../middlewares/validatorMiddleware');
  const { update${modulePascal}Schema } = require('../validators/${moduleCamel}.validator');
  const { authenticate } = require('../../../middlewares/authMiddleware');
  const { roleGuard } = require('../../../middlewares/roleGuard');
  const { ROLES } = require('../../../common/constants');
  `;
          routes = `router.use(authenticate);

  router.get('/', ${controllerName}.list);
  router.post('/:id', validatorMiddleware(update${modulePascal}Schema), ${controllerName}.update);
  router.delete('/:id', roleGuard([ROLES.ADMIN]), ${controllerName}.remove);
  `;
        }
        return `${imports}
  const router = Router();

  router.use(getModuleRateLimiter('${moduleCamel}-web'));

  ${routes}
  module.exports = router;
  `;
      }

      let imports = `import { Router } from 'express';
  import { getModuleRateLimiter } from '../../../common/rateLimiter';
  import { ${controllerName} } from '../controllers/${type}${modulePascal}.controller';
  `;
      let routes = '';
      if (!options.lite) {
        imports += `import { validatorMiddleware } from '../../../middlewares/validatorMiddleware';
  import { update${modulePascal}Schema } from '../validators/${moduleCamel}.validator';
  import { authenticate } from '../../../middlewares/authMiddleware';
  import { roleGuard } from '../../../middlewares/roleGuard';
  import { ROLES } from '../../../common/constants';
  `;
        routes = `router.use(authenticate);

  router.get('/', ${controllerName}.list);
  router.post('/:id', validatorMiddleware(update${modulePascal}Schema), ${controllerName}.update);
  router.delete('/:id', roleGuard([ROLES.ADMIN]), ${controllerName}.remove);
  `;
      }
      return `${imports}
  const router = Router();

  router.use(getModuleRateLimiter('${moduleCamel}-web'));

  ${routes}
  export default router;
  `;
    }

    return '';
  };

  const generateMainRoute = (): string => {
    const mobileSelected = options.mobile || (!options.mobile && !options.web);
    const webSelected = options.web || (!options.mobile && !options.web);

    if (language === 'js') {
      return `const { Router } = require('express');
  const router = Router();
  ${mobileSelected ? `const mobileRoutes = require('./mobile${modulePascal}Route');\nrouter.use('/mobile', mobileRoutes);` : ''}
  ${webSelected ? `const webRoutes = require('./web${modulePascal}Route');\nrouter.use('/web', webRoutes);` : ''}

  module.exports = router;
  `;
    }

    return `import { Router } from 'express';
  ${mobileSelected ? `import mobileRoutes from './mobile${modulePascal}Route';` : ''}
  ${webSelected ? `import webRoutes from './web${modulePascal}Route';` : ''}

  const router = Router();

  ${mobileSelected ? `router.use('/mobile', mobileRoutes);` : ''}
  ${webSelected ? `router.use('/web', webRoutes);` : ''}

  export default router;
  `;
  };

  const generateTest = (type: 'routes' | 'service'): string => {
    const testName = type === 'routes' ? 'Routes' : 'Service';
    return `describe('${modulePascal} ${testName}', () => {
    it('should have tests', () => {
      expect(true).toBe(true);
    });
  });
  `;
  };

  const generateReadme = (): string => {
    return `# ${modulePascal} Module

  ## Generated Routes

  - Mobile routes mounted at \`/api/${moduleSlug}/mobile\`
  - Web routes mounted at \`/api/${moduleSlug}/web\`

  ## Next Steps

  - Update validators in \`validators/${moduleCamel}.validator.${extension}\` to match your business rules.
  - Implement controller logic inside \`controllers/\` to integrate with services.
  - Wire up additional rate limiting or authentication requirements as needed.
  `;
  };

  const generateSeeder = (): string => {
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
    const seederFields = fields
      .filter((field) => !field.isPrivate)
      .map((field) => `      ${field.name}: ${field.sampleValue},`)
      .join('\n');

    if (language === 'js') {
      return `const { connectMongo, disconnectMongo } = require('../../src/db/mongoose');
  const ${modulePascal}Model = require('../../src/modules/${moduleCamel}/model/${moduleCamel}.model');

  const run = async () => {
    await connectMongo();

    await ${modulePascal}Model.deleteMany({});
    await ${modulePascal}Model.create([
      {
  ${seederFields}
      },
    ]);

    await disconnectMongo();
  };

  module.exports = { run };

  if (require.main === module) {
    run().catch((error) => {
      console.error('Seeder failed', error);
      process.exit(1);
    });
  }
  `;
    }

    return `import { connectMongo, disconnectMongo } from '../../src/db/mongoose';
  import { ${modulePascal}Model } from '../../src/modules/${moduleCamel}/model/${moduleCamel}.model';

  export const run = async () => {
    await connectMongo();

    await ${modulePascal}Model.deleteMany({});
    await ${modulePascal}Model.create([
      {
  ${seederFields}
      },
    ]);

    await disconnectMongo();
  };

  if (require.main === module) {
    run().catch((error) => {
      console.error('Seeder failed', error);
      process.exit(1);
    });
  }
  `;
  };

  const updateRootRouter = () => {
    const routerPath = path.resolve(process.cwd(), 'src', 'routes', 'index.ts');
    if (!fs.existsSync(routerPath)) {
      console.warn('Root router not found; skipped auto-registration.');
      return;
    }

    const importMarker = '// MODULE_IMPORTS';
    const routeMarker = '// MODULE_ROUTES';
    const importLine = `import ${moduleCamel}Routes from '../modules/${moduleCamel}/routes/route';`;
    const routeLine = `router.use('/${moduleSlug}', getModuleRateLimiter('${moduleCamel}'), ${moduleCamel}Routes);`;

    let content = fs.readFileSync(routerPath, 'utf8');
    if (!content.includes(importLine)) {
      content = content.replace(importMarker, `${importMarker}\n${importLine}`);
    }
    if (!content.includes(routeLine)) {
      content = content.replace(routeMarker, `${routeMarker}\n${routeLine}`);
    }
    fs.writeFileSync(routerPath, content, 'utf8');
    console.info('Updated src/routes/index.ts');
  };

  const main = () => {
    const moduleBase = ensureDirectories();

    const mobileSelected = options.mobile || (!options.mobile && !options.web);
    const webSelected = options.web || (!options.mobile && !options.web);

    const files: Record<string, string> = {
      [path.join(moduleBase, `model/${moduleCamel}.model.${extension}`)]: generateModel(),
      [path.join(moduleBase, `interfaces/${moduleCamel}.interface.${extension}`)]: generateInterface(),
      [path.join(moduleBase, `messages/message.${extension}`)]: generateMessage(),
      [path.join(moduleBase, `services/${moduleCamel}.service.${extension}`)]: generateService(),
      [path.join(moduleBase, `validators/${moduleCamel}.validator.${extension}`)]: generateValidator(),
      [path.join(moduleBase, 'README.md')]: generateReadme(),
      [path.join(moduleBase, `tests/${moduleCamel}.routes.spec.${extension}`)]: generateTest('routes'),
      [path.join(moduleBase, `tests/${moduleCamel}.service.spec.${extension}`)]: generateTest('service'),
      [path.join(moduleBase, `routes/route.${extension}`)]: generateMainRoute(),
    };

    if (mobileSelected) {
      files[path.join(moduleBase, `controllers/mobile${modulePascal}.controller.${extension}`)] = generateController('mobile');
      files[path.join(moduleBase, `routes/mobile${modulePascal}Route.${extension}`)] = generateRoute('mobile');
    }

    if (webSelected) {
      files[path.join(moduleBase, `controllers/web${modulePascal}.controller.${extension}`)] = generateController('web');
      files[path.join(moduleBase, `routes/web${modulePascal}Route.${extension}`)] = generateRoute('web');
    }

    if (options.admin) {
      files[path.join(moduleBase, `controllers/admin${modulePascal}.controller.${extension}`)] = generateController('admin');
    }

    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
    const seederFile = path.resolve(process.cwd(), 'seeders', `${timestamp}-${moduleSlug}.seed.${extension}`);
    files[seederFile] = generateSeeder();

    Object.entries(files).forEach(([filePath, content]) => writeFile(filePath, content));

    updateRootRouter();

    console.info(`\n✅ Module "${modulePascal}" generated successfully!`);
    console.info(`📁 Location: src/modules/${moduleCamel}/`);
  };

  main();
