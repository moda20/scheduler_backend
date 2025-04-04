
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.5.0
 * Query Engine version: 173f8d54f8d52e692c7e27e72a88314ec7aeff60
 */
Prisma.prismaVersion = {
  client: "6.5.0",
  engine: "173f8d54f8d52e692c7e27e72a88314ec7aeff60"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.SequelizeMetaScalarFieldEnum = {
  name: 'name'
};

exports.Prisma.Cache_filesScalarFieldEnum = {
  id: 'id',
  job_log_id: 'job_log_id',
  created_at: 'created_at',
  updated_at: 'updated_at',
  file_name: 'file_name',
  file_tags: 'file_tags',
  file_path: 'file_path',
  file_size: 'file_size',
  time_to_live: 'time_to_live',
  file_type: 'file_type',
  last_downloaded: 'last_downloaded'
};

exports.Prisma.Output_filesScalarFieldEnum = {
  id: 'id',
  job_log_id: 'job_log_id',
  created_at: 'created_at',
  updated_at: 'updated_at',
  file_name: 'file_name',
  file_tags: 'file_tags',
  file_path: 'file_path',
  file_size: 'file_size',
  file_type: 'file_type',
  last_downloaded: 'last_downloaded'
};

exports.Prisma.ProxyScalarFieldEnum = {
  id: 'id',
  proxy_ip: 'proxy_ip',
  proxy_port: 'proxy_port',
  protocol: 'protocol',
  username: 'username',
  password: 'password',
  description: 'description',
  status: 'status',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.Proxy_jobScalarFieldEnum = {
  id: 'id',
  job_id: 'job_id',
  proxy_id: 'proxy_id',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.Schedule_jobScalarFieldEnum = {
  job_id: 'job_id',
  job_name: 'job_name',
  job_param: 'job_param',
  job_cron_setting: 'job_cron_setting',
  consumer: 'consumer',
  exclusive: 'exclusive',
  status: 'status',
  average_time: 'average_time',
  created_at: 'created_at'
};

exports.Prisma.Schedule_job_logScalarFieldEnum = {
  job_log_id: 'job_log_id',
  job_id: 'job_id',
  machine: 'machine',
  start_time: 'start_time',
  end_time: 'end_time',
  result: 'result',
  error: 'error'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.SequelizeMetaOrderByRelevanceFieldEnum = {
  name: 'name'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.cache_filesOrderByRelevanceFieldEnum = {
  job_log_id: 'job_log_id',
  file_name: 'file_name',
  file_tags: 'file_tags',
  file_path: 'file_path',
  file_type: 'file_type'
};

exports.Prisma.output_filesOrderByRelevanceFieldEnum = {
  job_log_id: 'job_log_id',
  file_name: 'file_name',
  file_tags: 'file_tags',
  file_path: 'file_path',
  file_type: 'file_type'
};

exports.Prisma.proxyOrderByRelevanceFieldEnum = {
  proxy_ip: 'proxy_ip',
  protocol: 'protocol',
  username: 'username',
  password: 'password',
  description: 'description'
};

exports.Prisma.schedule_jobOrderByRelevanceFieldEnum = {
  job_name: 'job_name',
  job_param: 'job_param',
  job_cron_setting: 'job_cron_setting',
  consumer: 'consumer',
  exclusive: 'exclusive',
  status: 'status'
};

exports.Prisma.schedule_job_logOrderByRelevanceFieldEnum = {
  job_log_id: 'job_log_id',
  machine: 'machine',
  result: 'result',
  error: 'error'
};
exports.proxy_status = exports.$Enums.proxy_status = {
  active: 'active',
  inactive: 'inactive'
};

exports.Prisma.ModelName = {
  SequelizeMeta: 'SequelizeMeta',
  cache_files: 'cache_files',
  output_files: 'output_files',
  proxy: 'proxy',
  proxy_job: 'proxy_job',
  schedule_job: 'schedule_job',
  schedule_job_log: 'schedule_job_log'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
