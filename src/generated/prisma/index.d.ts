
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model Document
 * 
 */
export type Document = $Result.DefaultSelection<Prisma.$DocumentPayload>
/**
 * Model ChatSession
 * 
 */
export type ChatSession = $Result.DefaultSelection<Prisma.$ChatSessionPayload>
/**
 * Model ChatMessage
 * 
 */
export type ChatMessage = $Result.DefaultSelection<Prisma.$ChatMessagePayload>
/**
 * Model SecurityLog
 * 
 */
export type SecurityLog = $Result.DefaultSelection<Prisma.$SecurityLogPayload>
/**
 * Model VerificationToken
 * 
 */
export type VerificationToken = $Result.DefaultSelection<Prisma.$VerificationTokenPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const TokenType: {
  EMAIL_VERIFICATION: 'EMAIL_VERIFICATION',
  PASSWORD_RESET: 'PASSWORD_RESET'
};

export type TokenType = (typeof TokenType)[keyof typeof TokenType]


export const UserStatus: {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED'
};

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus]


export const DocumentStatus: {
  UPLOADED: 'UPLOADED',
  PROCESSING: 'PROCESSING',
  TEMPORARY: 'TEMPORARY',
  INDEXED: 'INDEXED',
  FAILED: 'FAILED'
};

export type DocumentStatus = (typeof DocumentStatus)[keyof typeof DocumentStatus]


export const MessageRole: {
  USER: 'USER',
  ASSISTANT: 'ASSISTANT'
};

export type MessageRole = (typeof MessageRole)[keyof typeof MessageRole]


export const SecurityAction: {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  EMAIL_CHANGE: 'EMAIL_CHANGE',
  PROFILE_UPDATE: 'PROFILE_UPDATE',
  TWO_FACTOR_ENABLED: 'TWO_FACTOR_ENABLED',
  TWO_FACTOR_DISABLED: 'TWO_FACTOR_DISABLED',
  TWO_FACTOR_LOGIN: 'TWO_FACTOR_LOGIN',
  DOCUMENT_UPLOAD: 'DOCUMENT_UPLOAD',
  DOCUMENT_DELETE: 'DOCUMENT_DELETE',
  CHAT_SAVE: 'CHAT_SAVE',
  CHAT_DELETE: 'CHAT_DELETE'
};

export type SecurityAction = (typeof SecurityAction)[keyof typeof SecurityAction]

}

export type TokenType = $Enums.TokenType

export const TokenType: typeof $Enums.TokenType

export type UserStatus = $Enums.UserStatus

export const UserStatus: typeof $Enums.UserStatus

export type DocumentStatus = $Enums.DocumentStatus

export const DocumentStatus: typeof $Enums.DocumentStatus

export type MessageRole = $Enums.MessageRole

export const MessageRole: typeof $Enums.MessageRole

export type SecurityAction = $Enums.SecurityAction

export const SecurityAction: typeof $Enums.SecurityAction

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.document`: Exposes CRUD operations for the **Document** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Documents
    * const documents = await prisma.document.findMany()
    * ```
    */
  get document(): Prisma.DocumentDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.chatSession`: Exposes CRUD operations for the **ChatSession** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ChatSessions
    * const chatSessions = await prisma.chatSession.findMany()
    * ```
    */
  get chatSession(): Prisma.ChatSessionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.chatMessage`: Exposes CRUD operations for the **ChatMessage** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ChatMessages
    * const chatMessages = await prisma.chatMessage.findMany()
    * ```
    */
  get chatMessage(): Prisma.ChatMessageDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.securityLog`: Exposes CRUD operations for the **SecurityLog** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SecurityLogs
    * const securityLogs = await prisma.securityLog.findMany()
    * ```
    */
  get securityLog(): Prisma.SecurityLogDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.verificationToken`: Exposes CRUD operations for the **VerificationToken** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more VerificationTokens
    * const verificationTokens = await prisma.verificationToken.findMany()
    * ```
    */
  get verificationToken(): Prisma.VerificationTokenDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.11.1
   * Query Engine version: f40f79ec31188888a2e33acda0ecc8fd10a853a9
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    User: 'User',
    Document: 'Document',
    ChatSession: 'ChatSession',
    ChatMessage: 'ChatMessage',
    SecurityLog: 'SecurityLog',
    VerificationToken: 'VerificationToken'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "user" | "document" | "chatSession" | "chatMessage" | "securityLog" | "verificationToken"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      Document: {
        payload: Prisma.$DocumentPayload<ExtArgs>
        fields: Prisma.DocumentFieldRefs
        operations: {
          findUnique: {
            args: Prisma.DocumentFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DocumentPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.DocumentFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DocumentPayload>
          }
          findFirst: {
            args: Prisma.DocumentFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DocumentPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.DocumentFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DocumentPayload>
          }
          findMany: {
            args: Prisma.DocumentFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DocumentPayload>[]
          }
          create: {
            args: Prisma.DocumentCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DocumentPayload>
          }
          createMany: {
            args: Prisma.DocumentCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.DocumentCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DocumentPayload>[]
          }
          delete: {
            args: Prisma.DocumentDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DocumentPayload>
          }
          update: {
            args: Prisma.DocumentUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DocumentPayload>
          }
          deleteMany: {
            args: Prisma.DocumentDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.DocumentUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.DocumentUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DocumentPayload>[]
          }
          upsert: {
            args: Prisma.DocumentUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DocumentPayload>
          }
          aggregate: {
            args: Prisma.DocumentAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateDocument>
          }
          groupBy: {
            args: Prisma.DocumentGroupByArgs<ExtArgs>
            result: $Utils.Optional<DocumentGroupByOutputType>[]
          }
          count: {
            args: Prisma.DocumentCountArgs<ExtArgs>
            result: $Utils.Optional<DocumentCountAggregateOutputType> | number
          }
        }
      }
      ChatSession: {
        payload: Prisma.$ChatSessionPayload<ExtArgs>
        fields: Prisma.ChatSessionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ChatSessionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatSessionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ChatSessionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatSessionPayload>
          }
          findFirst: {
            args: Prisma.ChatSessionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatSessionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ChatSessionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatSessionPayload>
          }
          findMany: {
            args: Prisma.ChatSessionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatSessionPayload>[]
          }
          create: {
            args: Prisma.ChatSessionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatSessionPayload>
          }
          createMany: {
            args: Prisma.ChatSessionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ChatSessionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatSessionPayload>[]
          }
          delete: {
            args: Prisma.ChatSessionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatSessionPayload>
          }
          update: {
            args: Prisma.ChatSessionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatSessionPayload>
          }
          deleteMany: {
            args: Prisma.ChatSessionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ChatSessionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ChatSessionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatSessionPayload>[]
          }
          upsert: {
            args: Prisma.ChatSessionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatSessionPayload>
          }
          aggregate: {
            args: Prisma.ChatSessionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateChatSession>
          }
          groupBy: {
            args: Prisma.ChatSessionGroupByArgs<ExtArgs>
            result: $Utils.Optional<ChatSessionGroupByOutputType>[]
          }
          count: {
            args: Prisma.ChatSessionCountArgs<ExtArgs>
            result: $Utils.Optional<ChatSessionCountAggregateOutputType> | number
          }
        }
      }
      ChatMessage: {
        payload: Prisma.$ChatMessagePayload<ExtArgs>
        fields: Prisma.ChatMessageFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ChatMessageFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatMessagePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ChatMessageFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatMessagePayload>
          }
          findFirst: {
            args: Prisma.ChatMessageFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatMessagePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ChatMessageFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatMessagePayload>
          }
          findMany: {
            args: Prisma.ChatMessageFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatMessagePayload>[]
          }
          create: {
            args: Prisma.ChatMessageCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatMessagePayload>
          }
          createMany: {
            args: Prisma.ChatMessageCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ChatMessageCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatMessagePayload>[]
          }
          delete: {
            args: Prisma.ChatMessageDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatMessagePayload>
          }
          update: {
            args: Prisma.ChatMessageUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatMessagePayload>
          }
          deleteMany: {
            args: Prisma.ChatMessageDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ChatMessageUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ChatMessageUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatMessagePayload>[]
          }
          upsert: {
            args: Prisma.ChatMessageUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatMessagePayload>
          }
          aggregate: {
            args: Prisma.ChatMessageAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateChatMessage>
          }
          groupBy: {
            args: Prisma.ChatMessageGroupByArgs<ExtArgs>
            result: $Utils.Optional<ChatMessageGroupByOutputType>[]
          }
          count: {
            args: Prisma.ChatMessageCountArgs<ExtArgs>
            result: $Utils.Optional<ChatMessageCountAggregateOutputType> | number
          }
        }
      }
      SecurityLog: {
        payload: Prisma.$SecurityLogPayload<ExtArgs>
        fields: Prisma.SecurityLogFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SecurityLogFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecurityLogPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SecurityLogFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecurityLogPayload>
          }
          findFirst: {
            args: Prisma.SecurityLogFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecurityLogPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SecurityLogFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecurityLogPayload>
          }
          findMany: {
            args: Prisma.SecurityLogFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecurityLogPayload>[]
          }
          create: {
            args: Prisma.SecurityLogCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecurityLogPayload>
          }
          createMany: {
            args: Prisma.SecurityLogCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SecurityLogCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecurityLogPayload>[]
          }
          delete: {
            args: Prisma.SecurityLogDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecurityLogPayload>
          }
          update: {
            args: Prisma.SecurityLogUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecurityLogPayload>
          }
          deleteMany: {
            args: Prisma.SecurityLogDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SecurityLogUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SecurityLogUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecurityLogPayload>[]
          }
          upsert: {
            args: Prisma.SecurityLogUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecurityLogPayload>
          }
          aggregate: {
            args: Prisma.SecurityLogAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSecurityLog>
          }
          groupBy: {
            args: Prisma.SecurityLogGroupByArgs<ExtArgs>
            result: $Utils.Optional<SecurityLogGroupByOutputType>[]
          }
          count: {
            args: Prisma.SecurityLogCountArgs<ExtArgs>
            result: $Utils.Optional<SecurityLogCountAggregateOutputType> | number
          }
        }
      }
      VerificationToken: {
        payload: Prisma.$VerificationTokenPayload<ExtArgs>
        fields: Prisma.VerificationTokenFieldRefs
        operations: {
          findUnique: {
            args: Prisma.VerificationTokenFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationTokenPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.VerificationTokenFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationTokenPayload>
          }
          findFirst: {
            args: Prisma.VerificationTokenFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationTokenPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.VerificationTokenFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationTokenPayload>
          }
          findMany: {
            args: Prisma.VerificationTokenFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationTokenPayload>[]
          }
          create: {
            args: Prisma.VerificationTokenCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationTokenPayload>
          }
          createMany: {
            args: Prisma.VerificationTokenCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.VerificationTokenCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationTokenPayload>[]
          }
          delete: {
            args: Prisma.VerificationTokenDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationTokenPayload>
          }
          update: {
            args: Prisma.VerificationTokenUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationTokenPayload>
          }
          deleteMany: {
            args: Prisma.VerificationTokenDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.VerificationTokenUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.VerificationTokenUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationTokenPayload>[]
          }
          upsert: {
            args: Prisma.VerificationTokenUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationTokenPayload>
          }
          aggregate: {
            args: Prisma.VerificationTokenAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateVerificationToken>
          }
          groupBy: {
            args: Prisma.VerificationTokenGroupByArgs<ExtArgs>
            result: $Utils.Optional<VerificationTokenGroupByOutputType>[]
          }
          count: {
            args: Prisma.VerificationTokenCountArgs<ExtArgs>
            result: $Utils.Optional<VerificationTokenCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    user?: UserOmit
    document?: DocumentOmit
    chatSession?: ChatSessionOmit
    chatMessage?: ChatMessageOmit
    securityLog?: SecurityLogOmit
    verificationToken?: VerificationTokenOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    documents: number
    chat_sessions: number
    security_logs: number
    verification_tokens: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    documents?: boolean | UserCountOutputTypeCountDocumentsArgs
    chat_sessions?: boolean | UserCountOutputTypeCountChat_sessionsArgs
    security_logs?: boolean | UserCountOutputTypeCountSecurity_logsArgs
    verification_tokens?: boolean | UserCountOutputTypeCountVerification_tokensArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountDocumentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: DocumentWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountChat_sessionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ChatSessionWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountSecurity_logsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SecurityLogWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountVerification_tokensArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: VerificationTokenWhereInput
  }


  /**
   * Count Type DocumentCountOutputType
   */

  export type DocumentCountOutputType = {
    chat_sessions: number
  }

  export type DocumentCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    chat_sessions?: boolean | DocumentCountOutputTypeCountChat_sessionsArgs
  }

  // Custom InputTypes
  /**
   * DocumentCountOutputType without action
   */
  export type DocumentCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DocumentCountOutputType
     */
    select?: DocumentCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * DocumentCountOutputType without action
   */
  export type DocumentCountOutputTypeCountChat_sessionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ChatSessionWhereInput
  }


  /**
   * Count Type ChatSessionCountOutputType
   */

  export type ChatSessionCountOutputType = {
    messages: number
  }

  export type ChatSessionCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    messages?: boolean | ChatSessionCountOutputTypeCountMessagesArgs
  }

  // Custom InputTypes
  /**
   * ChatSessionCountOutputType without action
   */
  export type ChatSessionCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatSessionCountOutputType
     */
    select?: ChatSessionCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ChatSessionCountOutputType without action
   */
  export type ChatSessionCountOutputTypeCountMessagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ChatMessageWhereInput
  }


  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    name: string | null
    email: string | null
    password: string | null
    job_title: string | null
    profile_picture: string | null
    is_paid_user: boolean | null
    two_factor_enabled: boolean | null
    two_factor_secret: string | null
    ai_personality: string | null
    status: $Enums.UserStatus | null
    email_verified: boolean | null
    created_at: Date | null
    updated_at: Date | null
    last_login_at: Date | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    name: string | null
    email: string | null
    password: string | null
    job_title: string | null
    profile_picture: string | null
    is_paid_user: boolean | null
    two_factor_enabled: boolean | null
    two_factor_secret: string | null
    ai_personality: string | null
    status: $Enums.UserStatus | null
    email_verified: boolean | null
    created_at: Date | null
    updated_at: Date | null
    last_login_at: Date | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    name: number
    email: number
    password: number
    job_title: number
    profile_picture: number
    is_paid_user: number
    two_factor_enabled: number
    two_factor_secret: number
    ai_personality: number
    status: number
    email_verified: number
    created_at: number
    updated_at: number
    last_login_at: number
    _all: number
  }


  export type UserMinAggregateInputType = {
    id?: true
    name?: true
    email?: true
    password?: true
    job_title?: true
    profile_picture?: true
    is_paid_user?: true
    two_factor_enabled?: true
    two_factor_secret?: true
    ai_personality?: true
    status?: true
    email_verified?: true
    created_at?: true
    updated_at?: true
    last_login_at?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    name?: true
    email?: true
    password?: true
    job_title?: true
    profile_picture?: true
    is_paid_user?: true
    two_factor_enabled?: true
    two_factor_secret?: true
    ai_personality?: true
    status?: true
    email_verified?: true
    created_at?: true
    updated_at?: true
    last_login_at?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    name?: true
    email?: true
    password?: true
    job_title?: true
    profile_picture?: true
    is_paid_user?: true
    two_factor_enabled?: true
    two_factor_secret?: true
    ai_personality?: true
    status?: true
    email_verified?: true
    created_at?: true
    updated_at?: true
    last_login_at?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    name: string | null
    email: string
    password: string
    job_title: string | null
    profile_picture: string | null
    is_paid_user: boolean
    two_factor_enabled: boolean
    two_factor_secret: string | null
    ai_personality: string | null
    status: $Enums.UserStatus
    email_verified: boolean
    created_at: Date
    updated_at: Date
    last_login_at: Date | null
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    email?: boolean
    password?: boolean
    job_title?: boolean
    profile_picture?: boolean
    is_paid_user?: boolean
    two_factor_enabled?: boolean
    two_factor_secret?: boolean
    ai_personality?: boolean
    status?: boolean
    email_verified?: boolean
    created_at?: boolean
    updated_at?: boolean
    last_login_at?: boolean
    documents?: boolean | User$documentsArgs<ExtArgs>
    chat_sessions?: boolean | User$chat_sessionsArgs<ExtArgs>
    security_logs?: boolean | User$security_logsArgs<ExtArgs>
    verification_tokens?: boolean | User$verification_tokensArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    email?: boolean
    password?: boolean
    job_title?: boolean
    profile_picture?: boolean
    is_paid_user?: boolean
    two_factor_enabled?: boolean
    two_factor_secret?: boolean
    ai_personality?: boolean
    status?: boolean
    email_verified?: boolean
    created_at?: boolean
    updated_at?: boolean
    last_login_at?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    email?: boolean
    password?: boolean
    job_title?: boolean
    profile_picture?: boolean
    is_paid_user?: boolean
    two_factor_enabled?: boolean
    two_factor_secret?: boolean
    ai_personality?: boolean
    status?: boolean
    email_verified?: boolean
    created_at?: boolean
    updated_at?: boolean
    last_login_at?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    name?: boolean
    email?: boolean
    password?: boolean
    job_title?: boolean
    profile_picture?: boolean
    is_paid_user?: boolean
    two_factor_enabled?: boolean
    two_factor_secret?: boolean
    ai_personality?: boolean
    status?: boolean
    email_verified?: boolean
    created_at?: boolean
    updated_at?: boolean
    last_login_at?: boolean
  }

  export type UserOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "email" | "password" | "job_title" | "profile_picture" | "is_paid_user" | "two_factor_enabled" | "two_factor_secret" | "ai_personality" | "status" | "email_verified" | "created_at" | "updated_at" | "last_login_at", ExtArgs["result"]["user"]>
  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    documents?: boolean | User$documentsArgs<ExtArgs>
    chat_sessions?: boolean | User$chat_sessionsArgs<ExtArgs>
    security_logs?: boolean | User$security_logsArgs<ExtArgs>
    verification_tokens?: boolean | User$verification_tokensArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type UserIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      documents: Prisma.$DocumentPayload<ExtArgs>[]
      chat_sessions: Prisma.$ChatSessionPayload<ExtArgs>[]
      security_logs: Prisma.$SecurityLogPayload<ExtArgs>[]
      verification_tokens: Prisma.$VerificationTokenPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string | null
      email: string
      password: string
      job_title: string | null
      profile_picture: string | null
      is_paid_user: boolean
      two_factor_enabled: boolean
      two_factor_secret: string | null
      ai_personality: string | null
      status: $Enums.UserStatus
      email_verified: boolean
      created_at: Date
      updated_at: Date
      last_login_at: Date | null
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users and returns the data updated in the database.
     * @param {UserUpdateManyAndReturnArgs} args - Arguments to update many Users.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Users and only return the `id`
     * const userWithIdOnly = await prisma.user.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends UserUpdateManyAndReturnArgs>(args: SelectSubset<T, UserUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    documents<T extends User$documentsArgs<ExtArgs> = {}>(args?: Subset<T, User$documentsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DocumentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    chat_sessions<T extends User$chat_sessionsArgs<ExtArgs> = {}>(args?: Subset<T, User$chat_sessionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChatSessionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    security_logs<T extends User$security_logsArgs<ExtArgs> = {}>(args?: Subset<T, User$security_logsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SecurityLogPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    verification_tokens<T extends User$verification_tokensArgs<ExtArgs> = {}>(args?: Subset<T, User$verification_tokensArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VerificationTokenPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'String'>
    readonly name: FieldRef<"User", 'String'>
    readonly email: FieldRef<"User", 'String'>
    readonly password: FieldRef<"User", 'String'>
    readonly job_title: FieldRef<"User", 'String'>
    readonly profile_picture: FieldRef<"User", 'String'>
    readonly is_paid_user: FieldRef<"User", 'Boolean'>
    readonly two_factor_enabled: FieldRef<"User", 'Boolean'>
    readonly two_factor_secret: FieldRef<"User", 'String'>
    readonly ai_personality: FieldRef<"User", 'String'>
    readonly status: FieldRef<"User", 'UserStatus'>
    readonly email_verified: FieldRef<"User", 'Boolean'>
    readonly created_at: FieldRef<"User", 'DateTime'>
    readonly updated_at: FieldRef<"User", 'DateTime'>
    readonly last_login_at: FieldRef<"User", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User updateManyAndReturn
   */
  export type UserUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to delete.
     */
    limit?: number
  }

  /**
   * User.documents
   */
  export type User$documentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Document
     */
    select?: DocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Document
     */
    omit?: DocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DocumentInclude<ExtArgs> | null
    where?: DocumentWhereInput
    orderBy?: DocumentOrderByWithRelationInput | DocumentOrderByWithRelationInput[]
    cursor?: DocumentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: DocumentScalarFieldEnum | DocumentScalarFieldEnum[]
  }

  /**
   * User.chat_sessions
   */
  export type User$chat_sessionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatSession
     */
    select?: ChatSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatSession
     */
    omit?: ChatSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatSessionInclude<ExtArgs> | null
    where?: ChatSessionWhereInput
    orderBy?: ChatSessionOrderByWithRelationInput | ChatSessionOrderByWithRelationInput[]
    cursor?: ChatSessionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ChatSessionScalarFieldEnum | ChatSessionScalarFieldEnum[]
  }

  /**
   * User.security_logs
   */
  export type User$security_logsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SecurityLog
     */
    select?: SecurityLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SecurityLog
     */
    omit?: SecurityLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SecurityLogInclude<ExtArgs> | null
    where?: SecurityLogWhereInput
    orderBy?: SecurityLogOrderByWithRelationInput | SecurityLogOrderByWithRelationInput[]
    cursor?: SecurityLogWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SecurityLogScalarFieldEnum | SecurityLogScalarFieldEnum[]
  }

  /**
   * User.verification_tokens
   */
  export type User$verification_tokensArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationToken
     */
    select?: VerificationTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationToken
     */
    omit?: VerificationTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationTokenInclude<ExtArgs> | null
    where?: VerificationTokenWhereInput
    orderBy?: VerificationTokenOrderByWithRelationInput | VerificationTokenOrderByWithRelationInput[]
    cursor?: VerificationTokenWhereUniqueInput
    take?: number
    skip?: number
    distinct?: VerificationTokenScalarFieldEnum | VerificationTokenScalarFieldEnum[]
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model Document
   */

  export type AggregateDocument = {
    _count: DocumentCountAggregateOutputType | null
    _avg: DocumentAvgAggregateOutputType | null
    _sum: DocumentSumAggregateOutputType | null
    _min: DocumentMinAggregateOutputType | null
    _max: DocumentMaxAggregateOutputType | null
  }

  export type DocumentAvgAggregateOutputType = {
    file_size: number | null
    page_count: number | null
  }

  export type DocumentSumAggregateOutputType = {
    file_size: number | null
    page_count: number | null
  }

  export type DocumentMinAggregateOutputType = {
    id: string | null
    file_name: string | null
    original_file_name: string | null
    file_path: string | null
    file_size: number | null
    mime_type: string | null
    status: $Enums.DocumentStatus | null
    is_scanned: boolean | null
    page_count: number | null
    owner_id: string | null
    uploaded_at: Date | null
    updated_at: Date | null
  }

  export type DocumentMaxAggregateOutputType = {
    id: string | null
    file_name: string | null
    original_file_name: string | null
    file_path: string | null
    file_size: number | null
    mime_type: string | null
    status: $Enums.DocumentStatus | null
    is_scanned: boolean | null
    page_count: number | null
    owner_id: string | null
    uploaded_at: Date | null
    updated_at: Date | null
  }

  export type DocumentCountAggregateOutputType = {
    id: number
    file_name: number
    original_file_name: number
    file_path: number
    file_size: number
    mime_type: number
    status: number
    is_scanned: number
    page_count: number
    owner_id: number
    uploaded_at: number
    updated_at: number
    _all: number
  }


  export type DocumentAvgAggregateInputType = {
    file_size?: true
    page_count?: true
  }

  export type DocumentSumAggregateInputType = {
    file_size?: true
    page_count?: true
  }

  export type DocumentMinAggregateInputType = {
    id?: true
    file_name?: true
    original_file_name?: true
    file_path?: true
    file_size?: true
    mime_type?: true
    status?: true
    is_scanned?: true
    page_count?: true
    owner_id?: true
    uploaded_at?: true
    updated_at?: true
  }

  export type DocumentMaxAggregateInputType = {
    id?: true
    file_name?: true
    original_file_name?: true
    file_path?: true
    file_size?: true
    mime_type?: true
    status?: true
    is_scanned?: true
    page_count?: true
    owner_id?: true
    uploaded_at?: true
    updated_at?: true
  }

  export type DocumentCountAggregateInputType = {
    id?: true
    file_name?: true
    original_file_name?: true
    file_path?: true
    file_size?: true
    mime_type?: true
    status?: true
    is_scanned?: true
    page_count?: true
    owner_id?: true
    uploaded_at?: true
    updated_at?: true
    _all?: true
  }

  export type DocumentAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Document to aggregate.
     */
    where?: DocumentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Documents to fetch.
     */
    orderBy?: DocumentOrderByWithRelationInput | DocumentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: DocumentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Documents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Documents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Documents
    **/
    _count?: true | DocumentCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: DocumentAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: DocumentSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: DocumentMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: DocumentMaxAggregateInputType
  }

  export type GetDocumentAggregateType<T extends DocumentAggregateArgs> = {
        [P in keyof T & keyof AggregateDocument]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateDocument[P]>
      : GetScalarType<T[P], AggregateDocument[P]>
  }




  export type DocumentGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: DocumentWhereInput
    orderBy?: DocumentOrderByWithAggregationInput | DocumentOrderByWithAggregationInput[]
    by: DocumentScalarFieldEnum[] | DocumentScalarFieldEnum
    having?: DocumentScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: DocumentCountAggregateInputType | true
    _avg?: DocumentAvgAggregateInputType
    _sum?: DocumentSumAggregateInputType
    _min?: DocumentMinAggregateInputType
    _max?: DocumentMaxAggregateInputType
  }

  export type DocumentGroupByOutputType = {
    id: string
    file_name: string
    original_file_name: string
    file_path: string
    file_size: number
    mime_type: string
    status: $Enums.DocumentStatus
    is_scanned: boolean | null
    page_count: number | null
    owner_id: string
    uploaded_at: Date
    updated_at: Date
    _count: DocumentCountAggregateOutputType | null
    _avg: DocumentAvgAggregateOutputType | null
    _sum: DocumentSumAggregateOutputType | null
    _min: DocumentMinAggregateOutputType | null
    _max: DocumentMaxAggregateOutputType | null
  }

  type GetDocumentGroupByPayload<T extends DocumentGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<DocumentGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof DocumentGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], DocumentGroupByOutputType[P]>
            : GetScalarType<T[P], DocumentGroupByOutputType[P]>
        }
      >
    >


  export type DocumentSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    file_name?: boolean
    original_file_name?: boolean
    file_path?: boolean
    file_size?: boolean
    mime_type?: boolean
    status?: boolean
    is_scanned?: boolean
    page_count?: boolean
    owner_id?: boolean
    uploaded_at?: boolean
    updated_at?: boolean
    owner?: boolean | UserDefaultArgs<ExtArgs>
    chat_sessions?: boolean | Document$chat_sessionsArgs<ExtArgs>
    _count?: boolean | DocumentCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["document"]>

  export type DocumentSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    file_name?: boolean
    original_file_name?: boolean
    file_path?: boolean
    file_size?: boolean
    mime_type?: boolean
    status?: boolean
    is_scanned?: boolean
    page_count?: boolean
    owner_id?: boolean
    uploaded_at?: boolean
    updated_at?: boolean
    owner?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["document"]>

  export type DocumentSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    file_name?: boolean
    original_file_name?: boolean
    file_path?: boolean
    file_size?: boolean
    mime_type?: boolean
    status?: boolean
    is_scanned?: boolean
    page_count?: boolean
    owner_id?: boolean
    uploaded_at?: boolean
    updated_at?: boolean
    owner?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["document"]>

  export type DocumentSelectScalar = {
    id?: boolean
    file_name?: boolean
    original_file_name?: boolean
    file_path?: boolean
    file_size?: boolean
    mime_type?: boolean
    status?: boolean
    is_scanned?: boolean
    page_count?: boolean
    owner_id?: boolean
    uploaded_at?: boolean
    updated_at?: boolean
  }

  export type DocumentOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "file_name" | "original_file_name" | "file_path" | "file_size" | "mime_type" | "status" | "is_scanned" | "page_count" | "owner_id" | "uploaded_at" | "updated_at", ExtArgs["result"]["document"]>
  export type DocumentInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    owner?: boolean | UserDefaultArgs<ExtArgs>
    chat_sessions?: boolean | Document$chat_sessionsArgs<ExtArgs>
    _count?: boolean | DocumentCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type DocumentIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    owner?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type DocumentIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    owner?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $DocumentPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Document"
    objects: {
      owner: Prisma.$UserPayload<ExtArgs>
      chat_sessions: Prisma.$ChatSessionPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      file_name: string
      original_file_name: string
      file_path: string
      file_size: number
      mime_type: string
      status: $Enums.DocumentStatus
      is_scanned: boolean | null
      page_count: number | null
      owner_id: string
      uploaded_at: Date
      updated_at: Date
    }, ExtArgs["result"]["document"]>
    composites: {}
  }

  type DocumentGetPayload<S extends boolean | null | undefined | DocumentDefaultArgs> = $Result.GetResult<Prisma.$DocumentPayload, S>

  type DocumentCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<DocumentFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: DocumentCountAggregateInputType | true
    }

  export interface DocumentDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Document'], meta: { name: 'Document' } }
    /**
     * Find zero or one Document that matches the filter.
     * @param {DocumentFindUniqueArgs} args - Arguments to find a Document
     * @example
     * // Get one Document
     * const document = await prisma.document.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends DocumentFindUniqueArgs>(args: SelectSubset<T, DocumentFindUniqueArgs<ExtArgs>>): Prisma__DocumentClient<$Result.GetResult<Prisma.$DocumentPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Document that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {DocumentFindUniqueOrThrowArgs} args - Arguments to find a Document
     * @example
     * // Get one Document
     * const document = await prisma.document.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends DocumentFindUniqueOrThrowArgs>(args: SelectSubset<T, DocumentFindUniqueOrThrowArgs<ExtArgs>>): Prisma__DocumentClient<$Result.GetResult<Prisma.$DocumentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Document that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DocumentFindFirstArgs} args - Arguments to find a Document
     * @example
     * // Get one Document
     * const document = await prisma.document.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends DocumentFindFirstArgs>(args?: SelectSubset<T, DocumentFindFirstArgs<ExtArgs>>): Prisma__DocumentClient<$Result.GetResult<Prisma.$DocumentPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Document that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DocumentFindFirstOrThrowArgs} args - Arguments to find a Document
     * @example
     * // Get one Document
     * const document = await prisma.document.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends DocumentFindFirstOrThrowArgs>(args?: SelectSubset<T, DocumentFindFirstOrThrowArgs<ExtArgs>>): Prisma__DocumentClient<$Result.GetResult<Prisma.$DocumentPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Documents that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DocumentFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Documents
     * const documents = await prisma.document.findMany()
     * 
     * // Get first 10 Documents
     * const documents = await prisma.document.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const documentWithIdOnly = await prisma.document.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends DocumentFindManyArgs>(args?: SelectSubset<T, DocumentFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DocumentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Document.
     * @param {DocumentCreateArgs} args - Arguments to create a Document.
     * @example
     * // Create one Document
     * const Document = await prisma.document.create({
     *   data: {
     *     // ... data to create a Document
     *   }
     * })
     * 
     */
    create<T extends DocumentCreateArgs>(args: SelectSubset<T, DocumentCreateArgs<ExtArgs>>): Prisma__DocumentClient<$Result.GetResult<Prisma.$DocumentPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Documents.
     * @param {DocumentCreateManyArgs} args - Arguments to create many Documents.
     * @example
     * // Create many Documents
     * const document = await prisma.document.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends DocumentCreateManyArgs>(args?: SelectSubset<T, DocumentCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Documents and returns the data saved in the database.
     * @param {DocumentCreateManyAndReturnArgs} args - Arguments to create many Documents.
     * @example
     * // Create many Documents
     * const document = await prisma.document.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Documents and only return the `id`
     * const documentWithIdOnly = await prisma.document.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends DocumentCreateManyAndReturnArgs>(args?: SelectSubset<T, DocumentCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DocumentPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Document.
     * @param {DocumentDeleteArgs} args - Arguments to delete one Document.
     * @example
     * // Delete one Document
     * const Document = await prisma.document.delete({
     *   where: {
     *     // ... filter to delete one Document
     *   }
     * })
     * 
     */
    delete<T extends DocumentDeleteArgs>(args: SelectSubset<T, DocumentDeleteArgs<ExtArgs>>): Prisma__DocumentClient<$Result.GetResult<Prisma.$DocumentPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Document.
     * @param {DocumentUpdateArgs} args - Arguments to update one Document.
     * @example
     * // Update one Document
     * const document = await prisma.document.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends DocumentUpdateArgs>(args: SelectSubset<T, DocumentUpdateArgs<ExtArgs>>): Prisma__DocumentClient<$Result.GetResult<Prisma.$DocumentPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Documents.
     * @param {DocumentDeleteManyArgs} args - Arguments to filter Documents to delete.
     * @example
     * // Delete a few Documents
     * const { count } = await prisma.document.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends DocumentDeleteManyArgs>(args?: SelectSubset<T, DocumentDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Documents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DocumentUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Documents
     * const document = await prisma.document.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends DocumentUpdateManyArgs>(args: SelectSubset<T, DocumentUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Documents and returns the data updated in the database.
     * @param {DocumentUpdateManyAndReturnArgs} args - Arguments to update many Documents.
     * @example
     * // Update many Documents
     * const document = await prisma.document.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Documents and only return the `id`
     * const documentWithIdOnly = await prisma.document.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends DocumentUpdateManyAndReturnArgs>(args: SelectSubset<T, DocumentUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DocumentPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Document.
     * @param {DocumentUpsertArgs} args - Arguments to update or create a Document.
     * @example
     * // Update or create a Document
     * const document = await prisma.document.upsert({
     *   create: {
     *     // ... data to create a Document
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Document we want to update
     *   }
     * })
     */
    upsert<T extends DocumentUpsertArgs>(args: SelectSubset<T, DocumentUpsertArgs<ExtArgs>>): Prisma__DocumentClient<$Result.GetResult<Prisma.$DocumentPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Documents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DocumentCountArgs} args - Arguments to filter Documents to count.
     * @example
     * // Count the number of Documents
     * const count = await prisma.document.count({
     *   where: {
     *     // ... the filter for the Documents we want to count
     *   }
     * })
    **/
    count<T extends DocumentCountArgs>(
      args?: Subset<T, DocumentCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], DocumentCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Document.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DocumentAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends DocumentAggregateArgs>(args: Subset<T, DocumentAggregateArgs>): Prisma.PrismaPromise<GetDocumentAggregateType<T>>

    /**
     * Group by Document.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DocumentGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends DocumentGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: DocumentGroupByArgs['orderBy'] }
        : { orderBy?: DocumentGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, DocumentGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetDocumentGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Document model
   */
  readonly fields: DocumentFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Document.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__DocumentClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    owner<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    chat_sessions<T extends Document$chat_sessionsArgs<ExtArgs> = {}>(args?: Subset<T, Document$chat_sessionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChatSessionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Document model
   */
  interface DocumentFieldRefs {
    readonly id: FieldRef<"Document", 'String'>
    readonly file_name: FieldRef<"Document", 'String'>
    readonly original_file_name: FieldRef<"Document", 'String'>
    readonly file_path: FieldRef<"Document", 'String'>
    readonly file_size: FieldRef<"Document", 'Int'>
    readonly mime_type: FieldRef<"Document", 'String'>
    readonly status: FieldRef<"Document", 'DocumentStatus'>
    readonly is_scanned: FieldRef<"Document", 'Boolean'>
    readonly page_count: FieldRef<"Document", 'Int'>
    readonly owner_id: FieldRef<"Document", 'String'>
    readonly uploaded_at: FieldRef<"Document", 'DateTime'>
    readonly updated_at: FieldRef<"Document", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Document findUnique
   */
  export type DocumentFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Document
     */
    select?: DocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Document
     */
    omit?: DocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DocumentInclude<ExtArgs> | null
    /**
     * Filter, which Document to fetch.
     */
    where: DocumentWhereUniqueInput
  }

  /**
   * Document findUniqueOrThrow
   */
  export type DocumentFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Document
     */
    select?: DocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Document
     */
    omit?: DocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DocumentInclude<ExtArgs> | null
    /**
     * Filter, which Document to fetch.
     */
    where: DocumentWhereUniqueInput
  }

  /**
   * Document findFirst
   */
  export type DocumentFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Document
     */
    select?: DocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Document
     */
    omit?: DocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DocumentInclude<ExtArgs> | null
    /**
     * Filter, which Document to fetch.
     */
    where?: DocumentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Documents to fetch.
     */
    orderBy?: DocumentOrderByWithRelationInput | DocumentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Documents.
     */
    cursor?: DocumentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Documents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Documents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Documents.
     */
    distinct?: DocumentScalarFieldEnum | DocumentScalarFieldEnum[]
  }

  /**
   * Document findFirstOrThrow
   */
  export type DocumentFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Document
     */
    select?: DocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Document
     */
    omit?: DocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DocumentInclude<ExtArgs> | null
    /**
     * Filter, which Document to fetch.
     */
    where?: DocumentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Documents to fetch.
     */
    orderBy?: DocumentOrderByWithRelationInput | DocumentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Documents.
     */
    cursor?: DocumentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Documents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Documents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Documents.
     */
    distinct?: DocumentScalarFieldEnum | DocumentScalarFieldEnum[]
  }

  /**
   * Document findMany
   */
  export type DocumentFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Document
     */
    select?: DocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Document
     */
    omit?: DocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DocumentInclude<ExtArgs> | null
    /**
     * Filter, which Documents to fetch.
     */
    where?: DocumentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Documents to fetch.
     */
    orderBy?: DocumentOrderByWithRelationInput | DocumentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Documents.
     */
    cursor?: DocumentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Documents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Documents.
     */
    skip?: number
    distinct?: DocumentScalarFieldEnum | DocumentScalarFieldEnum[]
  }

  /**
   * Document create
   */
  export type DocumentCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Document
     */
    select?: DocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Document
     */
    omit?: DocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DocumentInclude<ExtArgs> | null
    /**
     * The data needed to create a Document.
     */
    data: XOR<DocumentCreateInput, DocumentUncheckedCreateInput>
  }

  /**
   * Document createMany
   */
  export type DocumentCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Documents.
     */
    data: DocumentCreateManyInput | DocumentCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Document createManyAndReturn
   */
  export type DocumentCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Document
     */
    select?: DocumentSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Document
     */
    omit?: DocumentOmit<ExtArgs> | null
    /**
     * The data used to create many Documents.
     */
    data: DocumentCreateManyInput | DocumentCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DocumentIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Document update
   */
  export type DocumentUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Document
     */
    select?: DocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Document
     */
    omit?: DocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DocumentInclude<ExtArgs> | null
    /**
     * The data needed to update a Document.
     */
    data: XOR<DocumentUpdateInput, DocumentUncheckedUpdateInput>
    /**
     * Choose, which Document to update.
     */
    where: DocumentWhereUniqueInput
  }

  /**
   * Document updateMany
   */
  export type DocumentUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Documents.
     */
    data: XOR<DocumentUpdateManyMutationInput, DocumentUncheckedUpdateManyInput>
    /**
     * Filter which Documents to update
     */
    where?: DocumentWhereInput
    /**
     * Limit how many Documents to update.
     */
    limit?: number
  }

  /**
   * Document updateManyAndReturn
   */
  export type DocumentUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Document
     */
    select?: DocumentSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Document
     */
    omit?: DocumentOmit<ExtArgs> | null
    /**
     * The data used to update Documents.
     */
    data: XOR<DocumentUpdateManyMutationInput, DocumentUncheckedUpdateManyInput>
    /**
     * Filter which Documents to update
     */
    where?: DocumentWhereInput
    /**
     * Limit how many Documents to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DocumentIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Document upsert
   */
  export type DocumentUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Document
     */
    select?: DocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Document
     */
    omit?: DocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DocumentInclude<ExtArgs> | null
    /**
     * The filter to search for the Document to update in case it exists.
     */
    where: DocumentWhereUniqueInput
    /**
     * In case the Document found by the `where` argument doesn't exist, create a new Document with this data.
     */
    create: XOR<DocumentCreateInput, DocumentUncheckedCreateInput>
    /**
     * In case the Document was found with the provided `where` argument, update it with this data.
     */
    update: XOR<DocumentUpdateInput, DocumentUncheckedUpdateInput>
  }

  /**
   * Document delete
   */
  export type DocumentDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Document
     */
    select?: DocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Document
     */
    omit?: DocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DocumentInclude<ExtArgs> | null
    /**
     * Filter which Document to delete.
     */
    where: DocumentWhereUniqueInput
  }

  /**
   * Document deleteMany
   */
  export type DocumentDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Documents to delete
     */
    where?: DocumentWhereInput
    /**
     * Limit how many Documents to delete.
     */
    limit?: number
  }

  /**
   * Document.chat_sessions
   */
  export type Document$chat_sessionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatSession
     */
    select?: ChatSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatSession
     */
    omit?: ChatSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatSessionInclude<ExtArgs> | null
    where?: ChatSessionWhereInput
    orderBy?: ChatSessionOrderByWithRelationInput | ChatSessionOrderByWithRelationInput[]
    cursor?: ChatSessionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ChatSessionScalarFieldEnum | ChatSessionScalarFieldEnum[]
  }

  /**
   * Document without action
   */
  export type DocumentDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Document
     */
    select?: DocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Document
     */
    omit?: DocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DocumentInclude<ExtArgs> | null
  }


  /**
   * Model ChatSession
   */

  export type AggregateChatSession = {
    _count: ChatSessionCountAggregateOutputType | null
    _min: ChatSessionMinAggregateOutputType | null
    _max: ChatSessionMaxAggregateOutputType | null
  }

  export type ChatSessionMinAggregateOutputType = {
    id: string | null
    title: string | null
    user_id: string | null
    document_id: string | null
    is_saved: boolean | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type ChatSessionMaxAggregateOutputType = {
    id: string | null
    title: string | null
    user_id: string | null
    document_id: string | null
    is_saved: boolean | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type ChatSessionCountAggregateOutputType = {
    id: number
    title: number
    user_id: number
    document_id: number
    is_saved: number
    created_at: number
    updated_at: number
    _all: number
  }


  export type ChatSessionMinAggregateInputType = {
    id?: true
    title?: true
    user_id?: true
    document_id?: true
    is_saved?: true
    created_at?: true
    updated_at?: true
  }

  export type ChatSessionMaxAggregateInputType = {
    id?: true
    title?: true
    user_id?: true
    document_id?: true
    is_saved?: true
    created_at?: true
    updated_at?: true
  }

  export type ChatSessionCountAggregateInputType = {
    id?: true
    title?: true
    user_id?: true
    document_id?: true
    is_saved?: true
    created_at?: true
    updated_at?: true
    _all?: true
  }

  export type ChatSessionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ChatSession to aggregate.
     */
    where?: ChatSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ChatSessions to fetch.
     */
    orderBy?: ChatSessionOrderByWithRelationInput | ChatSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ChatSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ChatSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ChatSessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ChatSessions
    **/
    _count?: true | ChatSessionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ChatSessionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ChatSessionMaxAggregateInputType
  }

  export type GetChatSessionAggregateType<T extends ChatSessionAggregateArgs> = {
        [P in keyof T & keyof AggregateChatSession]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateChatSession[P]>
      : GetScalarType<T[P], AggregateChatSession[P]>
  }




  export type ChatSessionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ChatSessionWhereInput
    orderBy?: ChatSessionOrderByWithAggregationInput | ChatSessionOrderByWithAggregationInput[]
    by: ChatSessionScalarFieldEnum[] | ChatSessionScalarFieldEnum
    having?: ChatSessionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ChatSessionCountAggregateInputType | true
    _min?: ChatSessionMinAggregateInputType
    _max?: ChatSessionMaxAggregateInputType
  }

  export type ChatSessionGroupByOutputType = {
    id: string
    title: string | null
    user_id: string
    document_id: string
    is_saved: boolean
    created_at: Date
    updated_at: Date
    _count: ChatSessionCountAggregateOutputType | null
    _min: ChatSessionMinAggregateOutputType | null
    _max: ChatSessionMaxAggregateOutputType | null
  }

  type GetChatSessionGroupByPayload<T extends ChatSessionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ChatSessionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ChatSessionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ChatSessionGroupByOutputType[P]>
            : GetScalarType<T[P], ChatSessionGroupByOutputType[P]>
        }
      >
    >


  export type ChatSessionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    user_id?: boolean
    document_id?: boolean
    is_saved?: boolean
    created_at?: boolean
    updated_at?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    document?: boolean | DocumentDefaultArgs<ExtArgs>
    messages?: boolean | ChatSession$messagesArgs<ExtArgs>
    _count?: boolean | ChatSessionCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["chatSession"]>

  export type ChatSessionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    user_id?: boolean
    document_id?: boolean
    is_saved?: boolean
    created_at?: boolean
    updated_at?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    document?: boolean | DocumentDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["chatSession"]>

  export type ChatSessionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    user_id?: boolean
    document_id?: boolean
    is_saved?: boolean
    created_at?: boolean
    updated_at?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    document?: boolean | DocumentDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["chatSession"]>

  export type ChatSessionSelectScalar = {
    id?: boolean
    title?: boolean
    user_id?: boolean
    document_id?: boolean
    is_saved?: boolean
    created_at?: boolean
    updated_at?: boolean
  }

  export type ChatSessionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "title" | "user_id" | "document_id" | "is_saved" | "created_at" | "updated_at", ExtArgs["result"]["chatSession"]>
  export type ChatSessionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    document?: boolean | DocumentDefaultArgs<ExtArgs>
    messages?: boolean | ChatSession$messagesArgs<ExtArgs>
    _count?: boolean | ChatSessionCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ChatSessionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    document?: boolean | DocumentDefaultArgs<ExtArgs>
  }
  export type ChatSessionIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    document?: boolean | DocumentDefaultArgs<ExtArgs>
  }

  export type $ChatSessionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ChatSession"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
      document: Prisma.$DocumentPayload<ExtArgs>
      messages: Prisma.$ChatMessagePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      title: string | null
      user_id: string
      document_id: string
      is_saved: boolean
      created_at: Date
      updated_at: Date
    }, ExtArgs["result"]["chatSession"]>
    composites: {}
  }

  type ChatSessionGetPayload<S extends boolean | null | undefined | ChatSessionDefaultArgs> = $Result.GetResult<Prisma.$ChatSessionPayload, S>

  type ChatSessionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ChatSessionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ChatSessionCountAggregateInputType | true
    }

  export interface ChatSessionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ChatSession'], meta: { name: 'ChatSession' } }
    /**
     * Find zero or one ChatSession that matches the filter.
     * @param {ChatSessionFindUniqueArgs} args - Arguments to find a ChatSession
     * @example
     * // Get one ChatSession
     * const chatSession = await prisma.chatSession.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ChatSessionFindUniqueArgs>(args: SelectSubset<T, ChatSessionFindUniqueArgs<ExtArgs>>): Prisma__ChatSessionClient<$Result.GetResult<Prisma.$ChatSessionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ChatSession that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ChatSessionFindUniqueOrThrowArgs} args - Arguments to find a ChatSession
     * @example
     * // Get one ChatSession
     * const chatSession = await prisma.chatSession.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ChatSessionFindUniqueOrThrowArgs>(args: SelectSubset<T, ChatSessionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ChatSessionClient<$Result.GetResult<Prisma.$ChatSessionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ChatSession that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChatSessionFindFirstArgs} args - Arguments to find a ChatSession
     * @example
     * // Get one ChatSession
     * const chatSession = await prisma.chatSession.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ChatSessionFindFirstArgs>(args?: SelectSubset<T, ChatSessionFindFirstArgs<ExtArgs>>): Prisma__ChatSessionClient<$Result.GetResult<Prisma.$ChatSessionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ChatSession that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChatSessionFindFirstOrThrowArgs} args - Arguments to find a ChatSession
     * @example
     * // Get one ChatSession
     * const chatSession = await prisma.chatSession.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ChatSessionFindFirstOrThrowArgs>(args?: SelectSubset<T, ChatSessionFindFirstOrThrowArgs<ExtArgs>>): Prisma__ChatSessionClient<$Result.GetResult<Prisma.$ChatSessionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ChatSessions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChatSessionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ChatSessions
     * const chatSessions = await prisma.chatSession.findMany()
     * 
     * // Get first 10 ChatSessions
     * const chatSessions = await prisma.chatSession.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const chatSessionWithIdOnly = await prisma.chatSession.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ChatSessionFindManyArgs>(args?: SelectSubset<T, ChatSessionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChatSessionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ChatSession.
     * @param {ChatSessionCreateArgs} args - Arguments to create a ChatSession.
     * @example
     * // Create one ChatSession
     * const ChatSession = await prisma.chatSession.create({
     *   data: {
     *     // ... data to create a ChatSession
     *   }
     * })
     * 
     */
    create<T extends ChatSessionCreateArgs>(args: SelectSubset<T, ChatSessionCreateArgs<ExtArgs>>): Prisma__ChatSessionClient<$Result.GetResult<Prisma.$ChatSessionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ChatSessions.
     * @param {ChatSessionCreateManyArgs} args - Arguments to create many ChatSessions.
     * @example
     * // Create many ChatSessions
     * const chatSession = await prisma.chatSession.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ChatSessionCreateManyArgs>(args?: SelectSubset<T, ChatSessionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ChatSessions and returns the data saved in the database.
     * @param {ChatSessionCreateManyAndReturnArgs} args - Arguments to create many ChatSessions.
     * @example
     * // Create many ChatSessions
     * const chatSession = await prisma.chatSession.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ChatSessions and only return the `id`
     * const chatSessionWithIdOnly = await prisma.chatSession.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ChatSessionCreateManyAndReturnArgs>(args?: SelectSubset<T, ChatSessionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChatSessionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ChatSession.
     * @param {ChatSessionDeleteArgs} args - Arguments to delete one ChatSession.
     * @example
     * // Delete one ChatSession
     * const ChatSession = await prisma.chatSession.delete({
     *   where: {
     *     // ... filter to delete one ChatSession
     *   }
     * })
     * 
     */
    delete<T extends ChatSessionDeleteArgs>(args: SelectSubset<T, ChatSessionDeleteArgs<ExtArgs>>): Prisma__ChatSessionClient<$Result.GetResult<Prisma.$ChatSessionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ChatSession.
     * @param {ChatSessionUpdateArgs} args - Arguments to update one ChatSession.
     * @example
     * // Update one ChatSession
     * const chatSession = await prisma.chatSession.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ChatSessionUpdateArgs>(args: SelectSubset<T, ChatSessionUpdateArgs<ExtArgs>>): Prisma__ChatSessionClient<$Result.GetResult<Prisma.$ChatSessionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ChatSessions.
     * @param {ChatSessionDeleteManyArgs} args - Arguments to filter ChatSessions to delete.
     * @example
     * // Delete a few ChatSessions
     * const { count } = await prisma.chatSession.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ChatSessionDeleteManyArgs>(args?: SelectSubset<T, ChatSessionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ChatSessions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChatSessionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ChatSessions
     * const chatSession = await prisma.chatSession.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ChatSessionUpdateManyArgs>(args: SelectSubset<T, ChatSessionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ChatSessions and returns the data updated in the database.
     * @param {ChatSessionUpdateManyAndReturnArgs} args - Arguments to update many ChatSessions.
     * @example
     * // Update many ChatSessions
     * const chatSession = await prisma.chatSession.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ChatSessions and only return the `id`
     * const chatSessionWithIdOnly = await prisma.chatSession.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ChatSessionUpdateManyAndReturnArgs>(args: SelectSubset<T, ChatSessionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChatSessionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ChatSession.
     * @param {ChatSessionUpsertArgs} args - Arguments to update or create a ChatSession.
     * @example
     * // Update or create a ChatSession
     * const chatSession = await prisma.chatSession.upsert({
     *   create: {
     *     // ... data to create a ChatSession
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ChatSession we want to update
     *   }
     * })
     */
    upsert<T extends ChatSessionUpsertArgs>(args: SelectSubset<T, ChatSessionUpsertArgs<ExtArgs>>): Prisma__ChatSessionClient<$Result.GetResult<Prisma.$ChatSessionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ChatSessions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChatSessionCountArgs} args - Arguments to filter ChatSessions to count.
     * @example
     * // Count the number of ChatSessions
     * const count = await prisma.chatSession.count({
     *   where: {
     *     // ... the filter for the ChatSessions we want to count
     *   }
     * })
    **/
    count<T extends ChatSessionCountArgs>(
      args?: Subset<T, ChatSessionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ChatSessionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ChatSession.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChatSessionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ChatSessionAggregateArgs>(args: Subset<T, ChatSessionAggregateArgs>): Prisma.PrismaPromise<GetChatSessionAggregateType<T>>

    /**
     * Group by ChatSession.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChatSessionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ChatSessionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ChatSessionGroupByArgs['orderBy'] }
        : { orderBy?: ChatSessionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ChatSessionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetChatSessionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ChatSession model
   */
  readonly fields: ChatSessionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ChatSession.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ChatSessionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    document<T extends DocumentDefaultArgs<ExtArgs> = {}>(args?: Subset<T, DocumentDefaultArgs<ExtArgs>>): Prisma__DocumentClient<$Result.GetResult<Prisma.$DocumentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    messages<T extends ChatSession$messagesArgs<ExtArgs> = {}>(args?: Subset<T, ChatSession$messagesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChatMessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ChatSession model
   */
  interface ChatSessionFieldRefs {
    readonly id: FieldRef<"ChatSession", 'String'>
    readonly title: FieldRef<"ChatSession", 'String'>
    readonly user_id: FieldRef<"ChatSession", 'String'>
    readonly document_id: FieldRef<"ChatSession", 'String'>
    readonly is_saved: FieldRef<"ChatSession", 'Boolean'>
    readonly created_at: FieldRef<"ChatSession", 'DateTime'>
    readonly updated_at: FieldRef<"ChatSession", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ChatSession findUnique
   */
  export type ChatSessionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatSession
     */
    select?: ChatSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatSession
     */
    omit?: ChatSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatSessionInclude<ExtArgs> | null
    /**
     * Filter, which ChatSession to fetch.
     */
    where: ChatSessionWhereUniqueInput
  }

  /**
   * ChatSession findUniqueOrThrow
   */
  export type ChatSessionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatSession
     */
    select?: ChatSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatSession
     */
    omit?: ChatSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatSessionInclude<ExtArgs> | null
    /**
     * Filter, which ChatSession to fetch.
     */
    where: ChatSessionWhereUniqueInput
  }

  /**
   * ChatSession findFirst
   */
  export type ChatSessionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatSession
     */
    select?: ChatSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatSession
     */
    omit?: ChatSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatSessionInclude<ExtArgs> | null
    /**
     * Filter, which ChatSession to fetch.
     */
    where?: ChatSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ChatSessions to fetch.
     */
    orderBy?: ChatSessionOrderByWithRelationInput | ChatSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ChatSessions.
     */
    cursor?: ChatSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ChatSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ChatSessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ChatSessions.
     */
    distinct?: ChatSessionScalarFieldEnum | ChatSessionScalarFieldEnum[]
  }

  /**
   * ChatSession findFirstOrThrow
   */
  export type ChatSessionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatSession
     */
    select?: ChatSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatSession
     */
    omit?: ChatSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatSessionInclude<ExtArgs> | null
    /**
     * Filter, which ChatSession to fetch.
     */
    where?: ChatSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ChatSessions to fetch.
     */
    orderBy?: ChatSessionOrderByWithRelationInput | ChatSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ChatSessions.
     */
    cursor?: ChatSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ChatSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ChatSessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ChatSessions.
     */
    distinct?: ChatSessionScalarFieldEnum | ChatSessionScalarFieldEnum[]
  }

  /**
   * ChatSession findMany
   */
  export type ChatSessionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatSession
     */
    select?: ChatSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatSession
     */
    omit?: ChatSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatSessionInclude<ExtArgs> | null
    /**
     * Filter, which ChatSessions to fetch.
     */
    where?: ChatSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ChatSessions to fetch.
     */
    orderBy?: ChatSessionOrderByWithRelationInput | ChatSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ChatSessions.
     */
    cursor?: ChatSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ChatSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ChatSessions.
     */
    skip?: number
    distinct?: ChatSessionScalarFieldEnum | ChatSessionScalarFieldEnum[]
  }

  /**
   * ChatSession create
   */
  export type ChatSessionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatSession
     */
    select?: ChatSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatSession
     */
    omit?: ChatSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatSessionInclude<ExtArgs> | null
    /**
     * The data needed to create a ChatSession.
     */
    data: XOR<ChatSessionCreateInput, ChatSessionUncheckedCreateInput>
  }

  /**
   * ChatSession createMany
   */
  export type ChatSessionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ChatSessions.
     */
    data: ChatSessionCreateManyInput | ChatSessionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ChatSession createManyAndReturn
   */
  export type ChatSessionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatSession
     */
    select?: ChatSessionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ChatSession
     */
    omit?: ChatSessionOmit<ExtArgs> | null
    /**
     * The data used to create many ChatSessions.
     */
    data: ChatSessionCreateManyInput | ChatSessionCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatSessionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ChatSession update
   */
  export type ChatSessionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatSession
     */
    select?: ChatSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatSession
     */
    omit?: ChatSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatSessionInclude<ExtArgs> | null
    /**
     * The data needed to update a ChatSession.
     */
    data: XOR<ChatSessionUpdateInput, ChatSessionUncheckedUpdateInput>
    /**
     * Choose, which ChatSession to update.
     */
    where: ChatSessionWhereUniqueInput
  }

  /**
   * ChatSession updateMany
   */
  export type ChatSessionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ChatSessions.
     */
    data: XOR<ChatSessionUpdateManyMutationInput, ChatSessionUncheckedUpdateManyInput>
    /**
     * Filter which ChatSessions to update
     */
    where?: ChatSessionWhereInput
    /**
     * Limit how many ChatSessions to update.
     */
    limit?: number
  }

  /**
   * ChatSession updateManyAndReturn
   */
  export type ChatSessionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatSession
     */
    select?: ChatSessionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ChatSession
     */
    omit?: ChatSessionOmit<ExtArgs> | null
    /**
     * The data used to update ChatSessions.
     */
    data: XOR<ChatSessionUpdateManyMutationInput, ChatSessionUncheckedUpdateManyInput>
    /**
     * Filter which ChatSessions to update
     */
    where?: ChatSessionWhereInput
    /**
     * Limit how many ChatSessions to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatSessionIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * ChatSession upsert
   */
  export type ChatSessionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatSession
     */
    select?: ChatSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatSession
     */
    omit?: ChatSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatSessionInclude<ExtArgs> | null
    /**
     * The filter to search for the ChatSession to update in case it exists.
     */
    where: ChatSessionWhereUniqueInput
    /**
     * In case the ChatSession found by the `where` argument doesn't exist, create a new ChatSession with this data.
     */
    create: XOR<ChatSessionCreateInput, ChatSessionUncheckedCreateInput>
    /**
     * In case the ChatSession was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ChatSessionUpdateInput, ChatSessionUncheckedUpdateInput>
  }

  /**
   * ChatSession delete
   */
  export type ChatSessionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatSession
     */
    select?: ChatSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatSession
     */
    omit?: ChatSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatSessionInclude<ExtArgs> | null
    /**
     * Filter which ChatSession to delete.
     */
    where: ChatSessionWhereUniqueInput
  }

  /**
   * ChatSession deleteMany
   */
  export type ChatSessionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ChatSessions to delete
     */
    where?: ChatSessionWhereInput
    /**
     * Limit how many ChatSessions to delete.
     */
    limit?: number
  }

  /**
   * ChatSession.messages
   */
  export type ChatSession$messagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatMessage
     */
    select?: ChatMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatMessage
     */
    omit?: ChatMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatMessageInclude<ExtArgs> | null
    where?: ChatMessageWhereInput
    orderBy?: ChatMessageOrderByWithRelationInput | ChatMessageOrderByWithRelationInput[]
    cursor?: ChatMessageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ChatMessageScalarFieldEnum | ChatMessageScalarFieldEnum[]
  }

  /**
   * ChatSession without action
   */
  export type ChatSessionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatSession
     */
    select?: ChatSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatSession
     */
    omit?: ChatSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatSessionInclude<ExtArgs> | null
  }


  /**
   * Model ChatMessage
   */

  export type AggregateChatMessage = {
    _count: ChatMessageCountAggregateOutputType | null
    _avg: ChatMessageAvgAggregateOutputType | null
    _sum: ChatMessageSumAggregateOutputType | null
    _min: ChatMessageMinAggregateOutputType | null
    _max: ChatMessageMaxAggregateOutputType | null
  }

  export type ChatMessageAvgAggregateOutputType = {
    tokens_used: number | null
  }

  export type ChatMessageSumAggregateOutputType = {
    tokens_used: number | null
  }

  export type ChatMessageMinAggregateOutputType = {
    id: string | null
    session_id: string | null
    role: $Enums.MessageRole | null
    content: string | null
    tokens_used: number | null
    created_at: Date | null
  }

  export type ChatMessageMaxAggregateOutputType = {
    id: string | null
    session_id: string | null
    role: $Enums.MessageRole | null
    content: string | null
    tokens_used: number | null
    created_at: Date | null
  }

  export type ChatMessageCountAggregateOutputType = {
    id: number
    session_id: number
    role: number
    content: number
    source_nodes: number
    tokens_used: number
    created_at: number
    _all: number
  }


  export type ChatMessageAvgAggregateInputType = {
    tokens_used?: true
  }

  export type ChatMessageSumAggregateInputType = {
    tokens_used?: true
  }

  export type ChatMessageMinAggregateInputType = {
    id?: true
    session_id?: true
    role?: true
    content?: true
    tokens_used?: true
    created_at?: true
  }

  export type ChatMessageMaxAggregateInputType = {
    id?: true
    session_id?: true
    role?: true
    content?: true
    tokens_used?: true
    created_at?: true
  }

  export type ChatMessageCountAggregateInputType = {
    id?: true
    session_id?: true
    role?: true
    content?: true
    source_nodes?: true
    tokens_used?: true
    created_at?: true
    _all?: true
  }

  export type ChatMessageAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ChatMessage to aggregate.
     */
    where?: ChatMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ChatMessages to fetch.
     */
    orderBy?: ChatMessageOrderByWithRelationInput | ChatMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ChatMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ChatMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ChatMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ChatMessages
    **/
    _count?: true | ChatMessageCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ChatMessageAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ChatMessageSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ChatMessageMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ChatMessageMaxAggregateInputType
  }

  export type GetChatMessageAggregateType<T extends ChatMessageAggregateArgs> = {
        [P in keyof T & keyof AggregateChatMessage]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateChatMessage[P]>
      : GetScalarType<T[P], AggregateChatMessage[P]>
  }




  export type ChatMessageGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ChatMessageWhereInput
    orderBy?: ChatMessageOrderByWithAggregationInput | ChatMessageOrderByWithAggregationInput[]
    by: ChatMessageScalarFieldEnum[] | ChatMessageScalarFieldEnum
    having?: ChatMessageScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ChatMessageCountAggregateInputType | true
    _avg?: ChatMessageAvgAggregateInputType
    _sum?: ChatMessageSumAggregateInputType
    _min?: ChatMessageMinAggregateInputType
    _max?: ChatMessageMaxAggregateInputType
  }

  export type ChatMessageGroupByOutputType = {
    id: string
    session_id: string
    role: $Enums.MessageRole
    content: string
    source_nodes: JsonValue | null
    tokens_used: number | null
    created_at: Date
    _count: ChatMessageCountAggregateOutputType | null
    _avg: ChatMessageAvgAggregateOutputType | null
    _sum: ChatMessageSumAggregateOutputType | null
    _min: ChatMessageMinAggregateOutputType | null
    _max: ChatMessageMaxAggregateOutputType | null
  }

  type GetChatMessageGroupByPayload<T extends ChatMessageGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ChatMessageGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ChatMessageGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ChatMessageGroupByOutputType[P]>
            : GetScalarType<T[P], ChatMessageGroupByOutputType[P]>
        }
      >
    >


  export type ChatMessageSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    session_id?: boolean
    role?: boolean
    content?: boolean
    source_nodes?: boolean
    tokens_used?: boolean
    created_at?: boolean
    session?: boolean | ChatSessionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["chatMessage"]>

  export type ChatMessageSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    session_id?: boolean
    role?: boolean
    content?: boolean
    source_nodes?: boolean
    tokens_used?: boolean
    created_at?: boolean
    session?: boolean | ChatSessionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["chatMessage"]>

  export type ChatMessageSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    session_id?: boolean
    role?: boolean
    content?: boolean
    source_nodes?: boolean
    tokens_used?: boolean
    created_at?: boolean
    session?: boolean | ChatSessionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["chatMessage"]>

  export type ChatMessageSelectScalar = {
    id?: boolean
    session_id?: boolean
    role?: boolean
    content?: boolean
    source_nodes?: boolean
    tokens_used?: boolean
    created_at?: boolean
  }

  export type ChatMessageOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "session_id" | "role" | "content" | "source_nodes" | "tokens_used" | "created_at", ExtArgs["result"]["chatMessage"]>
  export type ChatMessageInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    session?: boolean | ChatSessionDefaultArgs<ExtArgs>
  }
  export type ChatMessageIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    session?: boolean | ChatSessionDefaultArgs<ExtArgs>
  }
  export type ChatMessageIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    session?: boolean | ChatSessionDefaultArgs<ExtArgs>
  }

  export type $ChatMessagePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ChatMessage"
    objects: {
      session: Prisma.$ChatSessionPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      session_id: string
      role: $Enums.MessageRole
      content: string
      source_nodes: Prisma.JsonValue | null
      tokens_used: number | null
      created_at: Date
    }, ExtArgs["result"]["chatMessage"]>
    composites: {}
  }

  type ChatMessageGetPayload<S extends boolean | null | undefined | ChatMessageDefaultArgs> = $Result.GetResult<Prisma.$ChatMessagePayload, S>

  type ChatMessageCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ChatMessageFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ChatMessageCountAggregateInputType | true
    }

  export interface ChatMessageDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ChatMessage'], meta: { name: 'ChatMessage' } }
    /**
     * Find zero or one ChatMessage that matches the filter.
     * @param {ChatMessageFindUniqueArgs} args - Arguments to find a ChatMessage
     * @example
     * // Get one ChatMessage
     * const chatMessage = await prisma.chatMessage.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ChatMessageFindUniqueArgs>(args: SelectSubset<T, ChatMessageFindUniqueArgs<ExtArgs>>): Prisma__ChatMessageClient<$Result.GetResult<Prisma.$ChatMessagePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ChatMessage that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ChatMessageFindUniqueOrThrowArgs} args - Arguments to find a ChatMessage
     * @example
     * // Get one ChatMessage
     * const chatMessage = await prisma.chatMessage.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ChatMessageFindUniqueOrThrowArgs>(args: SelectSubset<T, ChatMessageFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ChatMessageClient<$Result.GetResult<Prisma.$ChatMessagePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ChatMessage that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChatMessageFindFirstArgs} args - Arguments to find a ChatMessage
     * @example
     * // Get one ChatMessage
     * const chatMessage = await prisma.chatMessage.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ChatMessageFindFirstArgs>(args?: SelectSubset<T, ChatMessageFindFirstArgs<ExtArgs>>): Prisma__ChatMessageClient<$Result.GetResult<Prisma.$ChatMessagePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ChatMessage that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChatMessageFindFirstOrThrowArgs} args - Arguments to find a ChatMessage
     * @example
     * // Get one ChatMessage
     * const chatMessage = await prisma.chatMessage.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ChatMessageFindFirstOrThrowArgs>(args?: SelectSubset<T, ChatMessageFindFirstOrThrowArgs<ExtArgs>>): Prisma__ChatMessageClient<$Result.GetResult<Prisma.$ChatMessagePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ChatMessages that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChatMessageFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ChatMessages
     * const chatMessages = await prisma.chatMessage.findMany()
     * 
     * // Get first 10 ChatMessages
     * const chatMessages = await prisma.chatMessage.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const chatMessageWithIdOnly = await prisma.chatMessage.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ChatMessageFindManyArgs>(args?: SelectSubset<T, ChatMessageFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChatMessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ChatMessage.
     * @param {ChatMessageCreateArgs} args - Arguments to create a ChatMessage.
     * @example
     * // Create one ChatMessage
     * const ChatMessage = await prisma.chatMessage.create({
     *   data: {
     *     // ... data to create a ChatMessage
     *   }
     * })
     * 
     */
    create<T extends ChatMessageCreateArgs>(args: SelectSubset<T, ChatMessageCreateArgs<ExtArgs>>): Prisma__ChatMessageClient<$Result.GetResult<Prisma.$ChatMessagePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ChatMessages.
     * @param {ChatMessageCreateManyArgs} args - Arguments to create many ChatMessages.
     * @example
     * // Create many ChatMessages
     * const chatMessage = await prisma.chatMessage.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ChatMessageCreateManyArgs>(args?: SelectSubset<T, ChatMessageCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ChatMessages and returns the data saved in the database.
     * @param {ChatMessageCreateManyAndReturnArgs} args - Arguments to create many ChatMessages.
     * @example
     * // Create many ChatMessages
     * const chatMessage = await prisma.chatMessage.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ChatMessages and only return the `id`
     * const chatMessageWithIdOnly = await prisma.chatMessage.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ChatMessageCreateManyAndReturnArgs>(args?: SelectSubset<T, ChatMessageCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChatMessagePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ChatMessage.
     * @param {ChatMessageDeleteArgs} args - Arguments to delete one ChatMessage.
     * @example
     * // Delete one ChatMessage
     * const ChatMessage = await prisma.chatMessage.delete({
     *   where: {
     *     // ... filter to delete one ChatMessage
     *   }
     * })
     * 
     */
    delete<T extends ChatMessageDeleteArgs>(args: SelectSubset<T, ChatMessageDeleteArgs<ExtArgs>>): Prisma__ChatMessageClient<$Result.GetResult<Prisma.$ChatMessagePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ChatMessage.
     * @param {ChatMessageUpdateArgs} args - Arguments to update one ChatMessage.
     * @example
     * // Update one ChatMessage
     * const chatMessage = await prisma.chatMessage.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ChatMessageUpdateArgs>(args: SelectSubset<T, ChatMessageUpdateArgs<ExtArgs>>): Prisma__ChatMessageClient<$Result.GetResult<Prisma.$ChatMessagePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ChatMessages.
     * @param {ChatMessageDeleteManyArgs} args - Arguments to filter ChatMessages to delete.
     * @example
     * // Delete a few ChatMessages
     * const { count } = await prisma.chatMessage.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ChatMessageDeleteManyArgs>(args?: SelectSubset<T, ChatMessageDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ChatMessages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChatMessageUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ChatMessages
     * const chatMessage = await prisma.chatMessage.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ChatMessageUpdateManyArgs>(args: SelectSubset<T, ChatMessageUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ChatMessages and returns the data updated in the database.
     * @param {ChatMessageUpdateManyAndReturnArgs} args - Arguments to update many ChatMessages.
     * @example
     * // Update many ChatMessages
     * const chatMessage = await prisma.chatMessage.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ChatMessages and only return the `id`
     * const chatMessageWithIdOnly = await prisma.chatMessage.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ChatMessageUpdateManyAndReturnArgs>(args: SelectSubset<T, ChatMessageUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChatMessagePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ChatMessage.
     * @param {ChatMessageUpsertArgs} args - Arguments to update or create a ChatMessage.
     * @example
     * // Update or create a ChatMessage
     * const chatMessage = await prisma.chatMessage.upsert({
     *   create: {
     *     // ... data to create a ChatMessage
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ChatMessage we want to update
     *   }
     * })
     */
    upsert<T extends ChatMessageUpsertArgs>(args: SelectSubset<T, ChatMessageUpsertArgs<ExtArgs>>): Prisma__ChatMessageClient<$Result.GetResult<Prisma.$ChatMessagePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ChatMessages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChatMessageCountArgs} args - Arguments to filter ChatMessages to count.
     * @example
     * // Count the number of ChatMessages
     * const count = await prisma.chatMessage.count({
     *   where: {
     *     // ... the filter for the ChatMessages we want to count
     *   }
     * })
    **/
    count<T extends ChatMessageCountArgs>(
      args?: Subset<T, ChatMessageCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ChatMessageCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ChatMessage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChatMessageAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ChatMessageAggregateArgs>(args: Subset<T, ChatMessageAggregateArgs>): Prisma.PrismaPromise<GetChatMessageAggregateType<T>>

    /**
     * Group by ChatMessage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChatMessageGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ChatMessageGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ChatMessageGroupByArgs['orderBy'] }
        : { orderBy?: ChatMessageGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ChatMessageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetChatMessageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ChatMessage model
   */
  readonly fields: ChatMessageFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ChatMessage.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ChatMessageClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    session<T extends ChatSessionDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ChatSessionDefaultArgs<ExtArgs>>): Prisma__ChatSessionClient<$Result.GetResult<Prisma.$ChatSessionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ChatMessage model
   */
  interface ChatMessageFieldRefs {
    readonly id: FieldRef<"ChatMessage", 'String'>
    readonly session_id: FieldRef<"ChatMessage", 'String'>
    readonly role: FieldRef<"ChatMessage", 'MessageRole'>
    readonly content: FieldRef<"ChatMessage", 'String'>
    readonly source_nodes: FieldRef<"ChatMessage", 'Json'>
    readonly tokens_used: FieldRef<"ChatMessage", 'Int'>
    readonly created_at: FieldRef<"ChatMessage", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ChatMessage findUnique
   */
  export type ChatMessageFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatMessage
     */
    select?: ChatMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatMessage
     */
    omit?: ChatMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatMessageInclude<ExtArgs> | null
    /**
     * Filter, which ChatMessage to fetch.
     */
    where: ChatMessageWhereUniqueInput
  }

  /**
   * ChatMessage findUniqueOrThrow
   */
  export type ChatMessageFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatMessage
     */
    select?: ChatMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatMessage
     */
    omit?: ChatMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatMessageInclude<ExtArgs> | null
    /**
     * Filter, which ChatMessage to fetch.
     */
    where: ChatMessageWhereUniqueInput
  }

  /**
   * ChatMessage findFirst
   */
  export type ChatMessageFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatMessage
     */
    select?: ChatMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatMessage
     */
    omit?: ChatMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatMessageInclude<ExtArgs> | null
    /**
     * Filter, which ChatMessage to fetch.
     */
    where?: ChatMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ChatMessages to fetch.
     */
    orderBy?: ChatMessageOrderByWithRelationInput | ChatMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ChatMessages.
     */
    cursor?: ChatMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ChatMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ChatMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ChatMessages.
     */
    distinct?: ChatMessageScalarFieldEnum | ChatMessageScalarFieldEnum[]
  }

  /**
   * ChatMessage findFirstOrThrow
   */
  export type ChatMessageFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatMessage
     */
    select?: ChatMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatMessage
     */
    omit?: ChatMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatMessageInclude<ExtArgs> | null
    /**
     * Filter, which ChatMessage to fetch.
     */
    where?: ChatMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ChatMessages to fetch.
     */
    orderBy?: ChatMessageOrderByWithRelationInput | ChatMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ChatMessages.
     */
    cursor?: ChatMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ChatMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ChatMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ChatMessages.
     */
    distinct?: ChatMessageScalarFieldEnum | ChatMessageScalarFieldEnum[]
  }

  /**
   * ChatMessage findMany
   */
  export type ChatMessageFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatMessage
     */
    select?: ChatMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatMessage
     */
    omit?: ChatMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatMessageInclude<ExtArgs> | null
    /**
     * Filter, which ChatMessages to fetch.
     */
    where?: ChatMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ChatMessages to fetch.
     */
    orderBy?: ChatMessageOrderByWithRelationInput | ChatMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ChatMessages.
     */
    cursor?: ChatMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ChatMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ChatMessages.
     */
    skip?: number
    distinct?: ChatMessageScalarFieldEnum | ChatMessageScalarFieldEnum[]
  }

  /**
   * ChatMessage create
   */
  export type ChatMessageCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatMessage
     */
    select?: ChatMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatMessage
     */
    omit?: ChatMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatMessageInclude<ExtArgs> | null
    /**
     * The data needed to create a ChatMessage.
     */
    data: XOR<ChatMessageCreateInput, ChatMessageUncheckedCreateInput>
  }

  /**
   * ChatMessage createMany
   */
  export type ChatMessageCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ChatMessages.
     */
    data: ChatMessageCreateManyInput | ChatMessageCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ChatMessage createManyAndReturn
   */
  export type ChatMessageCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatMessage
     */
    select?: ChatMessageSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ChatMessage
     */
    omit?: ChatMessageOmit<ExtArgs> | null
    /**
     * The data used to create many ChatMessages.
     */
    data: ChatMessageCreateManyInput | ChatMessageCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatMessageIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ChatMessage update
   */
  export type ChatMessageUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatMessage
     */
    select?: ChatMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatMessage
     */
    omit?: ChatMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatMessageInclude<ExtArgs> | null
    /**
     * The data needed to update a ChatMessage.
     */
    data: XOR<ChatMessageUpdateInput, ChatMessageUncheckedUpdateInput>
    /**
     * Choose, which ChatMessage to update.
     */
    where: ChatMessageWhereUniqueInput
  }

  /**
   * ChatMessage updateMany
   */
  export type ChatMessageUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ChatMessages.
     */
    data: XOR<ChatMessageUpdateManyMutationInput, ChatMessageUncheckedUpdateManyInput>
    /**
     * Filter which ChatMessages to update
     */
    where?: ChatMessageWhereInput
    /**
     * Limit how many ChatMessages to update.
     */
    limit?: number
  }

  /**
   * ChatMessage updateManyAndReturn
   */
  export type ChatMessageUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatMessage
     */
    select?: ChatMessageSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ChatMessage
     */
    omit?: ChatMessageOmit<ExtArgs> | null
    /**
     * The data used to update ChatMessages.
     */
    data: XOR<ChatMessageUpdateManyMutationInput, ChatMessageUncheckedUpdateManyInput>
    /**
     * Filter which ChatMessages to update
     */
    where?: ChatMessageWhereInput
    /**
     * Limit how many ChatMessages to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatMessageIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * ChatMessage upsert
   */
  export type ChatMessageUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatMessage
     */
    select?: ChatMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatMessage
     */
    omit?: ChatMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatMessageInclude<ExtArgs> | null
    /**
     * The filter to search for the ChatMessage to update in case it exists.
     */
    where: ChatMessageWhereUniqueInput
    /**
     * In case the ChatMessage found by the `where` argument doesn't exist, create a new ChatMessage with this data.
     */
    create: XOR<ChatMessageCreateInput, ChatMessageUncheckedCreateInput>
    /**
     * In case the ChatMessage was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ChatMessageUpdateInput, ChatMessageUncheckedUpdateInput>
  }

  /**
   * ChatMessage delete
   */
  export type ChatMessageDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatMessage
     */
    select?: ChatMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatMessage
     */
    omit?: ChatMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatMessageInclude<ExtArgs> | null
    /**
     * Filter which ChatMessage to delete.
     */
    where: ChatMessageWhereUniqueInput
  }

  /**
   * ChatMessage deleteMany
   */
  export type ChatMessageDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ChatMessages to delete
     */
    where?: ChatMessageWhereInput
    /**
     * Limit how many ChatMessages to delete.
     */
    limit?: number
  }

  /**
   * ChatMessage without action
   */
  export type ChatMessageDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatMessage
     */
    select?: ChatMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatMessage
     */
    omit?: ChatMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatMessageInclude<ExtArgs> | null
  }


  /**
   * Model SecurityLog
   */

  export type AggregateSecurityLog = {
    _count: SecurityLogCountAggregateOutputType | null
    _min: SecurityLogMinAggregateOutputType | null
    _max: SecurityLogMaxAggregateOutputType | null
  }

  export type SecurityLogMinAggregateOutputType = {
    id: string | null
    user_id: string | null
    action: $Enums.SecurityAction | null
    details: string | null
    ip_address: string | null
    user_agent: string | null
    created_at: Date | null
  }

  export type SecurityLogMaxAggregateOutputType = {
    id: string | null
    user_id: string | null
    action: $Enums.SecurityAction | null
    details: string | null
    ip_address: string | null
    user_agent: string | null
    created_at: Date | null
  }

  export type SecurityLogCountAggregateOutputType = {
    id: number
    user_id: number
    action: number
    details: number
    ip_address: number
    user_agent: number
    created_at: number
    _all: number
  }


  export type SecurityLogMinAggregateInputType = {
    id?: true
    user_id?: true
    action?: true
    details?: true
    ip_address?: true
    user_agent?: true
    created_at?: true
  }

  export type SecurityLogMaxAggregateInputType = {
    id?: true
    user_id?: true
    action?: true
    details?: true
    ip_address?: true
    user_agent?: true
    created_at?: true
  }

  export type SecurityLogCountAggregateInputType = {
    id?: true
    user_id?: true
    action?: true
    details?: true
    ip_address?: true
    user_agent?: true
    created_at?: true
    _all?: true
  }

  export type SecurityLogAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SecurityLog to aggregate.
     */
    where?: SecurityLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SecurityLogs to fetch.
     */
    orderBy?: SecurityLogOrderByWithRelationInput | SecurityLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SecurityLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SecurityLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SecurityLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SecurityLogs
    **/
    _count?: true | SecurityLogCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SecurityLogMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SecurityLogMaxAggregateInputType
  }

  export type GetSecurityLogAggregateType<T extends SecurityLogAggregateArgs> = {
        [P in keyof T & keyof AggregateSecurityLog]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSecurityLog[P]>
      : GetScalarType<T[P], AggregateSecurityLog[P]>
  }




  export type SecurityLogGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SecurityLogWhereInput
    orderBy?: SecurityLogOrderByWithAggregationInput | SecurityLogOrderByWithAggregationInput[]
    by: SecurityLogScalarFieldEnum[] | SecurityLogScalarFieldEnum
    having?: SecurityLogScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SecurityLogCountAggregateInputType | true
    _min?: SecurityLogMinAggregateInputType
    _max?: SecurityLogMaxAggregateInputType
  }

  export type SecurityLogGroupByOutputType = {
    id: string
    user_id: string
    action: $Enums.SecurityAction
    details: string | null
    ip_address: string | null
    user_agent: string | null
    created_at: Date
    _count: SecurityLogCountAggregateOutputType | null
    _min: SecurityLogMinAggregateOutputType | null
    _max: SecurityLogMaxAggregateOutputType | null
  }

  type GetSecurityLogGroupByPayload<T extends SecurityLogGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SecurityLogGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SecurityLogGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SecurityLogGroupByOutputType[P]>
            : GetScalarType<T[P], SecurityLogGroupByOutputType[P]>
        }
      >
    >


  export type SecurityLogSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    user_id?: boolean
    action?: boolean
    details?: boolean
    ip_address?: boolean
    user_agent?: boolean
    created_at?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["securityLog"]>

  export type SecurityLogSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    user_id?: boolean
    action?: boolean
    details?: boolean
    ip_address?: boolean
    user_agent?: boolean
    created_at?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["securityLog"]>

  export type SecurityLogSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    user_id?: boolean
    action?: boolean
    details?: boolean
    ip_address?: boolean
    user_agent?: boolean
    created_at?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["securityLog"]>

  export type SecurityLogSelectScalar = {
    id?: boolean
    user_id?: boolean
    action?: boolean
    details?: boolean
    ip_address?: boolean
    user_agent?: boolean
    created_at?: boolean
  }

  export type SecurityLogOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "user_id" | "action" | "details" | "ip_address" | "user_agent" | "created_at", ExtArgs["result"]["securityLog"]>
  export type SecurityLogInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type SecurityLogIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type SecurityLogIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $SecurityLogPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SecurityLog"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      user_id: string
      action: $Enums.SecurityAction
      details: string | null
      ip_address: string | null
      user_agent: string | null
      created_at: Date
    }, ExtArgs["result"]["securityLog"]>
    composites: {}
  }

  type SecurityLogGetPayload<S extends boolean | null | undefined | SecurityLogDefaultArgs> = $Result.GetResult<Prisma.$SecurityLogPayload, S>

  type SecurityLogCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SecurityLogFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SecurityLogCountAggregateInputType | true
    }

  export interface SecurityLogDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SecurityLog'], meta: { name: 'SecurityLog' } }
    /**
     * Find zero or one SecurityLog that matches the filter.
     * @param {SecurityLogFindUniqueArgs} args - Arguments to find a SecurityLog
     * @example
     * // Get one SecurityLog
     * const securityLog = await prisma.securityLog.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SecurityLogFindUniqueArgs>(args: SelectSubset<T, SecurityLogFindUniqueArgs<ExtArgs>>): Prisma__SecurityLogClient<$Result.GetResult<Prisma.$SecurityLogPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one SecurityLog that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SecurityLogFindUniqueOrThrowArgs} args - Arguments to find a SecurityLog
     * @example
     * // Get one SecurityLog
     * const securityLog = await prisma.securityLog.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SecurityLogFindUniqueOrThrowArgs>(args: SelectSubset<T, SecurityLogFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SecurityLogClient<$Result.GetResult<Prisma.$SecurityLogPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SecurityLog that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SecurityLogFindFirstArgs} args - Arguments to find a SecurityLog
     * @example
     * // Get one SecurityLog
     * const securityLog = await prisma.securityLog.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SecurityLogFindFirstArgs>(args?: SelectSubset<T, SecurityLogFindFirstArgs<ExtArgs>>): Prisma__SecurityLogClient<$Result.GetResult<Prisma.$SecurityLogPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SecurityLog that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SecurityLogFindFirstOrThrowArgs} args - Arguments to find a SecurityLog
     * @example
     * // Get one SecurityLog
     * const securityLog = await prisma.securityLog.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SecurityLogFindFirstOrThrowArgs>(args?: SelectSubset<T, SecurityLogFindFirstOrThrowArgs<ExtArgs>>): Prisma__SecurityLogClient<$Result.GetResult<Prisma.$SecurityLogPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more SecurityLogs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SecurityLogFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SecurityLogs
     * const securityLogs = await prisma.securityLog.findMany()
     * 
     * // Get first 10 SecurityLogs
     * const securityLogs = await prisma.securityLog.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const securityLogWithIdOnly = await prisma.securityLog.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SecurityLogFindManyArgs>(args?: SelectSubset<T, SecurityLogFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SecurityLogPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a SecurityLog.
     * @param {SecurityLogCreateArgs} args - Arguments to create a SecurityLog.
     * @example
     * // Create one SecurityLog
     * const SecurityLog = await prisma.securityLog.create({
     *   data: {
     *     // ... data to create a SecurityLog
     *   }
     * })
     * 
     */
    create<T extends SecurityLogCreateArgs>(args: SelectSubset<T, SecurityLogCreateArgs<ExtArgs>>): Prisma__SecurityLogClient<$Result.GetResult<Prisma.$SecurityLogPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many SecurityLogs.
     * @param {SecurityLogCreateManyArgs} args - Arguments to create many SecurityLogs.
     * @example
     * // Create many SecurityLogs
     * const securityLog = await prisma.securityLog.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SecurityLogCreateManyArgs>(args?: SelectSubset<T, SecurityLogCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SecurityLogs and returns the data saved in the database.
     * @param {SecurityLogCreateManyAndReturnArgs} args - Arguments to create many SecurityLogs.
     * @example
     * // Create many SecurityLogs
     * const securityLog = await prisma.securityLog.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SecurityLogs and only return the `id`
     * const securityLogWithIdOnly = await prisma.securityLog.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SecurityLogCreateManyAndReturnArgs>(args?: SelectSubset<T, SecurityLogCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SecurityLogPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a SecurityLog.
     * @param {SecurityLogDeleteArgs} args - Arguments to delete one SecurityLog.
     * @example
     * // Delete one SecurityLog
     * const SecurityLog = await prisma.securityLog.delete({
     *   where: {
     *     // ... filter to delete one SecurityLog
     *   }
     * })
     * 
     */
    delete<T extends SecurityLogDeleteArgs>(args: SelectSubset<T, SecurityLogDeleteArgs<ExtArgs>>): Prisma__SecurityLogClient<$Result.GetResult<Prisma.$SecurityLogPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one SecurityLog.
     * @param {SecurityLogUpdateArgs} args - Arguments to update one SecurityLog.
     * @example
     * // Update one SecurityLog
     * const securityLog = await prisma.securityLog.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SecurityLogUpdateArgs>(args: SelectSubset<T, SecurityLogUpdateArgs<ExtArgs>>): Prisma__SecurityLogClient<$Result.GetResult<Prisma.$SecurityLogPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more SecurityLogs.
     * @param {SecurityLogDeleteManyArgs} args - Arguments to filter SecurityLogs to delete.
     * @example
     * // Delete a few SecurityLogs
     * const { count } = await prisma.securityLog.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SecurityLogDeleteManyArgs>(args?: SelectSubset<T, SecurityLogDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SecurityLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SecurityLogUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SecurityLogs
     * const securityLog = await prisma.securityLog.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SecurityLogUpdateManyArgs>(args: SelectSubset<T, SecurityLogUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SecurityLogs and returns the data updated in the database.
     * @param {SecurityLogUpdateManyAndReturnArgs} args - Arguments to update many SecurityLogs.
     * @example
     * // Update many SecurityLogs
     * const securityLog = await prisma.securityLog.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more SecurityLogs and only return the `id`
     * const securityLogWithIdOnly = await prisma.securityLog.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SecurityLogUpdateManyAndReturnArgs>(args: SelectSubset<T, SecurityLogUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SecurityLogPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one SecurityLog.
     * @param {SecurityLogUpsertArgs} args - Arguments to update or create a SecurityLog.
     * @example
     * // Update or create a SecurityLog
     * const securityLog = await prisma.securityLog.upsert({
     *   create: {
     *     // ... data to create a SecurityLog
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SecurityLog we want to update
     *   }
     * })
     */
    upsert<T extends SecurityLogUpsertArgs>(args: SelectSubset<T, SecurityLogUpsertArgs<ExtArgs>>): Prisma__SecurityLogClient<$Result.GetResult<Prisma.$SecurityLogPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of SecurityLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SecurityLogCountArgs} args - Arguments to filter SecurityLogs to count.
     * @example
     * // Count the number of SecurityLogs
     * const count = await prisma.securityLog.count({
     *   where: {
     *     // ... the filter for the SecurityLogs we want to count
     *   }
     * })
    **/
    count<T extends SecurityLogCountArgs>(
      args?: Subset<T, SecurityLogCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SecurityLogCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SecurityLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SecurityLogAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SecurityLogAggregateArgs>(args: Subset<T, SecurityLogAggregateArgs>): Prisma.PrismaPromise<GetSecurityLogAggregateType<T>>

    /**
     * Group by SecurityLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SecurityLogGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SecurityLogGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SecurityLogGroupByArgs['orderBy'] }
        : { orderBy?: SecurityLogGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SecurityLogGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSecurityLogGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SecurityLog model
   */
  readonly fields: SecurityLogFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SecurityLog.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SecurityLogClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SecurityLog model
   */
  interface SecurityLogFieldRefs {
    readonly id: FieldRef<"SecurityLog", 'String'>
    readonly user_id: FieldRef<"SecurityLog", 'String'>
    readonly action: FieldRef<"SecurityLog", 'SecurityAction'>
    readonly details: FieldRef<"SecurityLog", 'String'>
    readonly ip_address: FieldRef<"SecurityLog", 'String'>
    readonly user_agent: FieldRef<"SecurityLog", 'String'>
    readonly created_at: FieldRef<"SecurityLog", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SecurityLog findUnique
   */
  export type SecurityLogFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SecurityLog
     */
    select?: SecurityLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SecurityLog
     */
    omit?: SecurityLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SecurityLogInclude<ExtArgs> | null
    /**
     * Filter, which SecurityLog to fetch.
     */
    where: SecurityLogWhereUniqueInput
  }

  /**
   * SecurityLog findUniqueOrThrow
   */
  export type SecurityLogFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SecurityLog
     */
    select?: SecurityLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SecurityLog
     */
    omit?: SecurityLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SecurityLogInclude<ExtArgs> | null
    /**
     * Filter, which SecurityLog to fetch.
     */
    where: SecurityLogWhereUniqueInput
  }

  /**
   * SecurityLog findFirst
   */
  export type SecurityLogFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SecurityLog
     */
    select?: SecurityLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SecurityLog
     */
    omit?: SecurityLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SecurityLogInclude<ExtArgs> | null
    /**
     * Filter, which SecurityLog to fetch.
     */
    where?: SecurityLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SecurityLogs to fetch.
     */
    orderBy?: SecurityLogOrderByWithRelationInput | SecurityLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SecurityLogs.
     */
    cursor?: SecurityLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SecurityLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SecurityLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SecurityLogs.
     */
    distinct?: SecurityLogScalarFieldEnum | SecurityLogScalarFieldEnum[]
  }

  /**
   * SecurityLog findFirstOrThrow
   */
  export type SecurityLogFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SecurityLog
     */
    select?: SecurityLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SecurityLog
     */
    omit?: SecurityLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SecurityLogInclude<ExtArgs> | null
    /**
     * Filter, which SecurityLog to fetch.
     */
    where?: SecurityLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SecurityLogs to fetch.
     */
    orderBy?: SecurityLogOrderByWithRelationInput | SecurityLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SecurityLogs.
     */
    cursor?: SecurityLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SecurityLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SecurityLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SecurityLogs.
     */
    distinct?: SecurityLogScalarFieldEnum | SecurityLogScalarFieldEnum[]
  }

  /**
   * SecurityLog findMany
   */
  export type SecurityLogFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SecurityLog
     */
    select?: SecurityLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SecurityLog
     */
    omit?: SecurityLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SecurityLogInclude<ExtArgs> | null
    /**
     * Filter, which SecurityLogs to fetch.
     */
    where?: SecurityLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SecurityLogs to fetch.
     */
    orderBy?: SecurityLogOrderByWithRelationInput | SecurityLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SecurityLogs.
     */
    cursor?: SecurityLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SecurityLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SecurityLogs.
     */
    skip?: number
    distinct?: SecurityLogScalarFieldEnum | SecurityLogScalarFieldEnum[]
  }

  /**
   * SecurityLog create
   */
  export type SecurityLogCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SecurityLog
     */
    select?: SecurityLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SecurityLog
     */
    omit?: SecurityLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SecurityLogInclude<ExtArgs> | null
    /**
     * The data needed to create a SecurityLog.
     */
    data: XOR<SecurityLogCreateInput, SecurityLogUncheckedCreateInput>
  }

  /**
   * SecurityLog createMany
   */
  export type SecurityLogCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SecurityLogs.
     */
    data: SecurityLogCreateManyInput | SecurityLogCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SecurityLog createManyAndReturn
   */
  export type SecurityLogCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SecurityLog
     */
    select?: SecurityLogSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SecurityLog
     */
    omit?: SecurityLogOmit<ExtArgs> | null
    /**
     * The data used to create many SecurityLogs.
     */
    data: SecurityLogCreateManyInput | SecurityLogCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SecurityLogIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * SecurityLog update
   */
  export type SecurityLogUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SecurityLog
     */
    select?: SecurityLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SecurityLog
     */
    omit?: SecurityLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SecurityLogInclude<ExtArgs> | null
    /**
     * The data needed to update a SecurityLog.
     */
    data: XOR<SecurityLogUpdateInput, SecurityLogUncheckedUpdateInput>
    /**
     * Choose, which SecurityLog to update.
     */
    where: SecurityLogWhereUniqueInput
  }

  /**
   * SecurityLog updateMany
   */
  export type SecurityLogUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SecurityLogs.
     */
    data: XOR<SecurityLogUpdateManyMutationInput, SecurityLogUncheckedUpdateManyInput>
    /**
     * Filter which SecurityLogs to update
     */
    where?: SecurityLogWhereInput
    /**
     * Limit how many SecurityLogs to update.
     */
    limit?: number
  }

  /**
   * SecurityLog updateManyAndReturn
   */
  export type SecurityLogUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SecurityLog
     */
    select?: SecurityLogSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SecurityLog
     */
    omit?: SecurityLogOmit<ExtArgs> | null
    /**
     * The data used to update SecurityLogs.
     */
    data: XOR<SecurityLogUpdateManyMutationInput, SecurityLogUncheckedUpdateManyInput>
    /**
     * Filter which SecurityLogs to update
     */
    where?: SecurityLogWhereInput
    /**
     * Limit how many SecurityLogs to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SecurityLogIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * SecurityLog upsert
   */
  export type SecurityLogUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SecurityLog
     */
    select?: SecurityLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SecurityLog
     */
    omit?: SecurityLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SecurityLogInclude<ExtArgs> | null
    /**
     * The filter to search for the SecurityLog to update in case it exists.
     */
    where: SecurityLogWhereUniqueInput
    /**
     * In case the SecurityLog found by the `where` argument doesn't exist, create a new SecurityLog with this data.
     */
    create: XOR<SecurityLogCreateInput, SecurityLogUncheckedCreateInput>
    /**
     * In case the SecurityLog was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SecurityLogUpdateInput, SecurityLogUncheckedUpdateInput>
  }

  /**
   * SecurityLog delete
   */
  export type SecurityLogDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SecurityLog
     */
    select?: SecurityLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SecurityLog
     */
    omit?: SecurityLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SecurityLogInclude<ExtArgs> | null
    /**
     * Filter which SecurityLog to delete.
     */
    where: SecurityLogWhereUniqueInput
  }

  /**
   * SecurityLog deleteMany
   */
  export type SecurityLogDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SecurityLogs to delete
     */
    where?: SecurityLogWhereInput
    /**
     * Limit how many SecurityLogs to delete.
     */
    limit?: number
  }

  /**
   * SecurityLog without action
   */
  export type SecurityLogDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SecurityLog
     */
    select?: SecurityLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SecurityLog
     */
    omit?: SecurityLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SecurityLogInclude<ExtArgs> | null
  }


  /**
   * Model VerificationToken
   */

  export type AggregateVerificationToken = {
    _count: VerificationTokenCountAggregateOutputType | null
    _min: VerificationTokenMinAggregateOutputType | null
    _max: VerificationTokenMaxAggregateOutputType | null
  }

  export type VerificationTokenMinAggregateOutputType = {
    id: string | null
    email: string | null
    key: string | null
    token: string | null
    user_id: string | null
    type: $Enums.TokenType | null
    expires_at: Date | null
    used: boolean | null
    created_at: Date | null
  }

  export type VerificationTokenMaxAggregateOutputType = {
    id: string | null
    email: string | null
    key: string | null
    token: string | null
    user_id: string | null
    type: $Enums.TokenType | null
    expires_at: Date | null
    used: boolean | null
    created_at: Date | null
  }

  export type VerificationTokenCountAggregateOutputType = {
    id: number
    email: number
    key: number
    token: number
    user_id: number
    type: number
    expires_at: number
    used: number
    created_at: number
    _all: number
  }


  export type VerificationTokenMinAggregateInputType = {
    id?: true
    email?: true
    key?: true
    token?: true
    user_id?: true
    type?: true
    expires_at?: true
    used?: true
    created_at?: true
  }

  export type VerificationTokenMaxAggregateInputType = {
    id?: true
    email?: true
    key?: true
    token?: true
    user_id?: true
    type?: true
    expires_at?: true
    used?: true
    created_at?: true
  }

  export type VerificationTokenCountAggregateInputType = {
    id?: true
    email?: true
    key?: true
    token?: true
    user_id?: true
    type?: true
    expires_at?: true
    used?: true
    created_at?: true
    _all?: true
  }

  export type VerificationTokenAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which VerificationToken to aggregate.
     */
    where?: VerificationTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VerificationTokens to fetch.
     */
    orderBy?: VerificationTokenOrderByWithRelationInput | VerificationTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: VerificationTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VerificationTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VerificationTokens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned VerificationTokens
    **/
    _count?: true | VerificationTokenCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: VerificationTokenMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: VerificationTokenMaxAggregateInputType
  }

  export type GetVerificationTokenAggregateType<T extends VerificationTokenAggregateArgs> = {
        [P in keyof T & keyof AggregateVerificationToken]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateVerificationToken[P]>
      : GetScalarType<T[P], AggregateVerificationToken[P]>
  }




  export type VerificationTokenGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: VerificationTokenWhereInput
    orderBy?: VerificationTokenOrderByWithAggregationInput | VerificationTokenOrderByWithAggregationInput[]
    by: VerificationTokenScalarFieldEnum[] | VerificationTokenScalarFieldEnum
    having?: VerificationTokenScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: VerificationTokenCountAggregateInputType | true
    _min?: VerificationTokenMinAggregateInputType
    _max?: VerificationTokenMaxAggregateInputType
  }

  export type VerificationTokenGroupByOutputType = {
    id: string
    email: string
    key: string
    token: string
    user_id: string | null
    type: $Enums.TokenType
    expires_at: Date
    used: boolean
    created_at: Date
    _count: VerificationTokenCountAggregateOutputType | null
    _min: VerificationTokenMinAggregateOutputType | null
    _max: VerificationTokenMaxAggregateOutputType | null
  }

  type GetVerificationTokenGroupByPayload<T extends VerificationTokenGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<VerificationTokenGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof VerificationTokenGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], VerificationTokenGroupByOutputType[P]>
            : GetScalarType<T[P], VerificationTokenGroupByOutputType[P]>
        }
      >
    >


  export type VerificationTokenSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    key?: boolean
    token?: boolean
    user_id?: boolean
    type?: boolean
    expires_at?: boolean
    used?: boolean
    created_at?: boolean
    user?: boolean | VerificationToken$userArgs<ExtArgs>
  }, ExtArgs["result"]["verificationToken"]>

  export type VerificationTokenSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    key?: boolean
    token?: boolean
    user_id?: boolean
    type?: boolean
    expires_at?: boolean
    used?: boolean
    created_at?: boolean
    user?: boolean | VerificationToken$userArgs<ExtArgs>
  }, ExtArgs["result"]["verificationToken"]>

  export type VerificationTokenSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    key?: boolean
    token?: boolean
    user_id?: boolean
    type?: boolean
    expires_at?: boolean
    used?: boolean
    created_at?: boolean
    user?: boolean | VerificationToken$userArgs<ExtArgs>
  }, ExtArgs["result"]["verificationToken"]>

  export type VerificationTokenSelectScalar = {
    id?: boolean
    email?: boolean
    key?: boolean
    token?: boolean
    user_id?: boolean
    type?: boolean
    expires_at?: boolean
    used?: boolean
    created_at?: boolean
  }

  export type VerificationTokenOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "email" | "key" | "token" | "user_id" | "type" | "expires_at" | "used" | "created_at", ExtArgs["result"]["verificationToken"]>
  export type VerificationTokenInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | VerificationToken$userArgs<ExtArgs>
  }
  export type VerificationTokenIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | VerificationToken$userArgs<ExtArgs>
  }
  export type VerificationTokenIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | VerificationToken$userArgs<ExtArgs>
  }

  export type $VerificationTokenPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "VerificationToken"
    objects: {
      user: Prisma.$UserPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      email: string
      key: string
      token: string
      user_id: string | null
      type: $Enums.TokenType
      expires_at: Date
      used: boolean
      created_at: Date
    }, ExtArgs["result"]["verificationToken"]>
    composites: {}
  }

  type VerificationTokenGetPayload<S extends boolean | null | undefined | VerificationTokenDefaultArgs> = $Result.GetResult<Prisma.$VerificationTokenPayload, S>

  type VerificationTokenCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<VerificationTokenFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: VerificationTokenCountAggregateInputType | true
    }

  export interface VerificationTokenDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['VerificationToken'], meta: { name: 'VerificationToken' } }
    /**
     * Find zero or one VerificationToken that matches the filter.
     * @param {VerificationTokenFindUniqueArgs} args - Arguments to find a VerificationToken
     * @example
     * // Get one VerificationToken
     * const verificationToken = await prisma.verificationToken.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends VerificationTokenFindUniqueArgs>(args: SelectSubset<T, VerificationTokenFindUniqueArgs<ExtArgs>>): Prisma__VerificationTokenClient<$Result.GetResult<Prisma.$VerificationTokenPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one VerificationToken that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {VerificationTokenFindUniqueOrThrowArgs} args - Arguments to find a VerificationToken
     * @example
     * // Get one VerificationToken
     * const verificationToken = await prisma.verificationToken.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends VerificationTokenFindUniqueOrThrowArgs>(args: SelectSubset<T, VerificationTokenFindUniqueOrThrowArgs<ExtArgs>>): Prisma__VerificationTokenClient<$Result.GetResult<Prisma.$VerificationTokenPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first VerificationToken that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationTokenFindFirstArgs} args - Arguments to find a VerificationToken
     * @example
     * // Get one VerificationToken
     * const verificationToken = await prisma.verificationToken.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends VerificationTokenFindFirstArgs>(args?: SelectSubset<T, VerificationTokenFindFirstArgs<ExtArgs>>): Prisma__VerificationTokenClient<$Result.GetResult<Prisma.$VerificationTokenPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first VerificationToken that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationTokenFindFirstOrThrowArgs} args - Arguments to find a VerificationToken
     * @example
     * // Get one VerificationToken
     * const verificationToken = await prisma.verificationToken.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends VerificationTokenFindFirstOrThrowArgs>(args?: SelectSubset<T, VerificationTokenFindFirstOrThrowArgs<ExtArgs>>): Prisma__VerificationTokenClient<$Result.GetResult<Prisma.$VerificationTokenPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more VerificationTokens that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationTokenFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all VerificationTokens
     * const verificationTokens = await prisma.verificationToken.findMany()
     * 
     * // Get first 10 VerificationTokens
     * const verificationTokens = await prisma.verificationToken.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const verificationTokenWithIdOnly = await prisma.verificationToken.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends VerificationTokenFindManyArgs>(args?: SelectSubset<T, VerificationTokenFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VerificationTokenPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a VerificationToken.
     * @param {VerificationTokenCreateArgs} args - Arguments to create a VerificationToken.
     * @example
     * // Create one VerificationToken
     * const VerificationToken = await prisma.verificationToken.create({
     *   data: {
     *     // ... data to create a VerificationToken
     *   }
     * })
     * 
     */
    create<T extends VerificationTokenCreateArgs>(args: SelectSubset<T, VerificationTokenCreateArgs<ExtArgs>>): Prisma__VerificationTokenClient<$Result.GetResult<Prisma.$VerificationTokenPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many VerificationTokens.
     * @param {VerificationTokenCreateManyArgs} args - Arguments to create many VerificationTokens.
     * @example
     * // Create many VerificationTokens
     * const verificationToken = await prisma.verificationToken.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends VerificationTokenCreateManyArgs>(args?: SelectSubset<T, VerificationTokenCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many VerificationTokens and returns the data saved in the database.
     * @param {VerificationTokenCreateManyAndReturnArgs} args - Arguments to create many VerificationTokens.
     * @example
     * // Create many VerificationTokens
     * const verificationToken = await prisma.verificationToken.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many VerificationTokens and only return the `id`
     * const verificationTokenWithIdOnly = await prisma.verificationToken.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends VerificationTokenCreateManyAndReturnArgs>(args?: SelectSubset<T, VerificationTokenCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VerificationTokenPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a VerificationToken.
     * @param {VerificationTokenDeleteArgs} args - Arguments to delete one VerificationToken.
     * @example
     * // Delete one VerificationToken
     * const VerificationToken = await prisma.verificationToken.delete({
     *   where: {
     *     // ... filter to delete one VerificationToken
     *   }
     * })
     * 
     */
    delete<T extends VerificationTokenDeleteArgs>(args: SelectSubset<T, VerificationTokenDeleteArgs<ExtArgs>>): Prisma__VerificationTokenClient<$Result.GetResult<Prisma.$VerificationTokenPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one VerificationToken.
     * @param {VerificationTokenUpdateArgs} args - Arguments to update one VerificationToken.
     * @example
     * // Update one VerificationToken
     * const verificationToken = await prisma.verificationToken.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends VerificationTokenUpdateArgs>(args: SelectSubset<T, VerificationTokenUpdateArgs<ExtArgs>>): Prisma__VerificationTokenClient<$Result.GetResult<Prisma.$VerificationTokenPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more VerificationTokens.
     * @param {VerificationTokenDeleteManyArgs} args - Arguments to filter VerificationTokens to delete.
     * @example
     * // Delete a few VerificationTokens
     * const { count } = await prisma.verificationToken.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends VerificationTokenDeleteManyArgs>(args?: SelectSubset<T, VerificationTokenDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more VerificationTokens.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationTokenUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many VerificationTokens
     * const verificationToken = await prisma.verificationToken.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends VerificationTokenUpdateManyArgs>(args: SelectSubset<T, VerificationTokenUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more VerificationTokens and returns the data updated in the database.
     * @param {VerificationTokenUpdateManyAndReturnArgs} args - Arguments to update many VerificationTokens.
     * @example
     * // Update many VerificationTokens
     * const verificationToken = await prisma.verificationToken.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more VerificationTokens and only return the `id`
     * const verificationTokenWithIdOnly = await prisma.verificationToken.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends VerificationTokenUpdateManyAndReturnArgs>(args: SelectSubset<T, VerificationTokenUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VerificationTokenPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one VerificationToken.
     * @param {VerificationTokenUpsertArgs} args - Arguments to update or create a VerificationToken.
     * @example
     * // Update or create a VerificationToken
     * const verificationToken = await prisma.verificationToken.upsert({
     *   create: {
     *     // ... data to create a VerificationToken
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the VerificationToken we want to update
     *   }
     * })
     */
    upsert<T extends VerificationTokenUpsertArgs>(args: SelectSubset<T, VerificationTokenUpsertArgs<ExtArgs>>): Prisma__VerificationTokenClient<$Result.GetResult<Prisma.$VerificationTokenPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of VerificationTokens.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationTokenCountArgs} args - Arguments to filter VerificationTokens to count.
     * @example
     * // Count the number of VerificationTokens
     * const count = await prisma.verificationToken.count({
     *   where: {
     *     // ... the filter for the VerificationTokens we want to count
     *   }
     * })
    **/
    count<T extends VerificationTokenCountArgs>(
      args?: Subset<T, VerificationTokenCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], VerificationTokenCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a VerificationToken.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationTokenAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends VerificationTokenAggregateArgs>(args: Subset<T, VerificationTokenAggregateArgs>): Prisma.PrismaPromise<GetVerificationTokenAggregateType<T>>

    /**
     * Group by VerificationToken.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationTokenGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends VerificationTokenGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: VerificationTokenGroupByArgs['orderBy'] }
        : { orderBy?: VerificationTokenGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, VerificationTokenGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetVerificationTokenGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the VerificationToken model
   */
  readonly fields: VerificationTokenFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for VerificationToken.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__VerificationTokenClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends VerificationToken$userArgs<ExtArgs> = {}>(args?: Subset<T, VerificationToken$userArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the VerificationToken model
   */
  interface VerificationTokenFieldRefs {
    readonly id: FieldRef<"VerificationToken", 'String'>
    readonly email: FieldRef<"VerificationToken", 'String'>
    readonly key: FieldRef<"VerificationToken", 'String'>
    readonly token: FieldRef<"VerificationToken", 'String'>
    readonly user_id: FieldRef<"VerificationToken", 'String'>
    readonly type: FieldRef<"VerificationToken", 'TokenType'>
    readonly expires_at: FieldRef<"VerificationToken", 'DateTime'>
    readonly used: FieldRef<"VerificationToken", 'Boolean'>
    readonly created_at: FieldRef<"VerificationToken", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * VerificationToken findUnique
   */
  export type VerificationTokenFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationToken
     */
    select?: VerificationTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationToken
     */
    omit?: VerificationTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationTokenInclude<ExtArgs> | null
    /**
     * Filter, which VerificationToken to fetch.
     */
    where: VerificationTokenWhereUniqueInput
  }

  /**
   * VerificationToken findUniqueOrThrow
   */
  export type VerificationTokenFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationToken
     */
    select?: VerificationTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationToken
     */
    omit?: VerificationTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationTokenInclude<ExtArgs> | null
    /**
     * Filter, which VerificationToken to fetch.
     */
    where: VerificationTokenWhereUniqueInput
  }

  /**
   * VerificationToken findFirst
   */
  export type VerificationTokenFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationToken
     */
    select?: VerificationTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationToken
     */
    omit?: VerificationTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationTokenInclude<ExtArgs> | null
    /**
     * Filter, which VerificationToken to fetch.
     */
    where?: VerificationTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VerificationTokens to fetch.
     */
    orderBy?: VerificationTokenOrderByWithRelationInput | VerificationTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for VerificationTokens.
     */
    cursor?: VerificationTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VerificationTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VerificationTokens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of VerificationTokens.
     */
    distinct?: VerificationTokenScalarFieldEnum | VerificationTokenScalarFieldEnum[]
  }

  /**
   * VerificationToken findFirstOrThrow
   */
  export type VerificationTokenFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationToken
     */
    select?: VerificationTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationToken
     */
    omit?: VerificationTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationTokenInclude<ExtArgs> | null
    /**
     * Filter, which VerificationToken to fetch.
     */
    where?: VerificationTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VerificationTokens to fetch.
     */
    orderBy?: VerificationTokenOrderByWithRelationInput | VerificationTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for VerificationTokens.
     */
    cursor?: VerificationTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VerificationTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VerificationTokens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of VerificationTokens.
     */
    distinct?: VerificationTokenScalarFieldEnum | VerificationTokenScalarFieldEnum[]
  }

  /**
   * VerificationToken findMany
   */
  export type VerificationTokenFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationToken
     */
    select?: VerificationTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationToken
     */
    omit?: VerificationTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationTokenInclude<ExtArgs> | null
    /**
     * Filter, which VerificationTokens to fetch.
     */
    where?: VerificationTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VerificationTokens to fetch.
     */
    orderBy?: VerificationTokenOrderByWithRelationInput | VerificationTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing VerificationTokens.
     */
    cursor?: VerificationTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VerificationTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VerificationTokens.
     */
    skip?: number
    distinct?: VerificationTokenScalarFieldEnum | VerificationTokenScalarFieldEnum[]
  }

  /**
   * VerificationToken create
   */
  export type VerificationTokenCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationToken
     */
    select?: VerificationTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationToken
     */
    omit?: VerificationTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationTokenInclude<ExtArgs> | null
    /**
     * The data needed to create a VerificationToken.
     */
    data: XOR<VerificationTokenCreateInput, VerificationTokenUncheckedCreateInput>
  }

  /**
   * VerificationToken createMany
   */
  export type VerificationTokenCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many VerificationTokens.
     */
    data: VerificationTokenCreateManyInput | VerificationTokenCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * VerificationToken createManyAndReturn
   */
  export type VerificationTokenCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationToken
     */
    select?: VerificationTokenSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationToken
     */
    omit?: VerificationTokenOmit<ExtArgs> | null
    /**
     * The data used to create many VerificationTokens.
     */
    data: VerificationTokenCreateManyInput | VerificationTokenCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationTokenIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * VerificationToken update
   */
  export type VerificationTokenUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationToken
     */
    select?: VerificationTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationToken
     */
    omit?: VerificationTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationTokenInclude<ExtArgs> | null
    /**
     * The data needed to update a VerificationToken.
     */
    data: XOR<VerificationTokenUpdateInput, VerificationTokenUncheckedUpdateInput>
    /**
     * Choose, which VerificationToken to update.
     */
    where: VerificationTokenWhereUniqueInput
  }

  /**
   * VerificationToken updateMany
   */
  export type VerificationTokenUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update VerificationTokens.
     */
    data: XOR<VerificationTokenUpdateManyMutationInput, VerificationTokenUncheckedUpdateManyInput>
    /**
     * Filter which VerificationTokens to update
     */
    where?: VerificationTokenWhereInput
    /**
     * Limit how many VerificationTokens to update.
     */
    limit?: number
  }

  /**
   * VerificationToken updateManyAndReturn
   */
  export type VerificationTokenUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationToken
     */
    select?: VerificationTokenSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationToken
     */
    omit?: VerificationTokenOmit<ExtArgs> | null
    /**
     * The data used to update VerificationTokens.
     */
    data: XOR<VerificationTokenUpdateManyMutationInput, VerificationTokenUncheckedUpdateManyInput>
    /**
     * Filter which VerificationTokens to update
     */
    where?: VerificationTokenWhereInput
    /**
     * Limit how many VerificationTokens to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationTokenIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * VerificationToken upsert
   */
  export type VerificationTokenUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationToken
     */
    select?: VerificationTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationToken
     */
    omit?: VerificationTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationTokenInclude<ExtArgs> | null
    /**
     * The filter to search for the VerificationToken to update in case it exists.
     */
    where: VerificationTokenWhereUniqueInput
    /**
     * In case the VerificationToken found by the `where` argument doesn't exist, create a new VerificationToken with this data.
     */
    create: XOR<VerificationTokenCreateInput, VerificationTokenUncheckedCreateInput>
    /**
     * In case the VerificationToken was found with the provided `where` argument, update it with this data.
     */
    update: XOR<VerificationTokenUpdateInput, VerificationTokenUncheckedUpdateInput>
  }

  /**
   * VerificationToken delete
   */
  export type VerificationTokenDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationToken
     */
    select?: VerificationTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationToken
     */
    omit?: VerificationTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationTokenInclude<ExtArgs> | null
    /**
     * Filter which VerificationToken to delete.
     */
    where: VerificationTokenWhereUniqueInput
  }

  /**
   * VerificationToken deleteMany
   */
  export type VerificationTokenDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which VerificationTokens to delete
     */
    where?: VerificationTokenWhereInput
    /**
     * Limit how many VerificationTokens to delete.
     */
    limit?: number
  }

  /**
   * VerificationToken.user
   */
  export type VerificationToken$userArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    where?: UserWhereInput
  }

  /**
   * VerificationToken without action
   */
  export type VerificationTokenDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationToken
     */
    select?: VerificationTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationToken
     */
    omit?: VerificationTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationTokenInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const UserScalarFieldEnum: {
    id: 'id',
    name: 'name',
    email: 'email',
    password: 'password',
    job_title: 'job_title',
    profile_picture: 'profile_picture',
    is_paid_user: 'is_paid_user',
    two_factor_enabled: 'two_factor_enabled',
    two_factor_secret: 'two_factor_secret',
    ai_personality: 'ai_personality',
    status: 'status',
    email_verified: 'email_verified',
    created_at: 'created_at',
    updated_at: 'updated_at',
    last_login_at: 'last_login_at'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const DocumentScalarFieldEnum: {
    id: 'id',
    file_name: 'file_name',
    original_file_name: 'original_file_name',
    file_path: 'file_path',
    file_size: 'file_size',
    mime_type: 'mime_type',
    status: 'status',
    is_scanned: 'is_scanned',
    page_count: 'page_count',
    owner_id: 'owner_id',
    uploaded_at: 'uploaded_at',
    updated_at: 'updated_at'
  };

  export type DocumentScalarFieldEnum = (typeof DocumentScalarFieldEnum)[keyof typeof DocumentScalarFieldEnum]


  export const ChatSessionScalarFieldEnum: {
    id: 'id',
    title: 'title',
    user_id: 'user_id',
    document_id: 'document_id',
    is_saved: 'is_saved',
    created_at: 'created_at',
    updated_at: 'updated_at'
  };

  export type ChatSessionScalarFieldEnum = (typeof ChatSessionScalarFieldEnum)[keyof typeof ChatSessionScalarFieldEnum]


  export const ChatMessageScalarFieldEnum: {
    id: 'id',
    session_id: 'session_id',
    role: 'role',
    content: 'content',
    source_nodes: 'source_nodes',
    tokens_used: 'tokens_used',
    created_at: 'created_at'
  };

  export type ChatMessageScalarFieldEnum = (typeof ChatMessageScalarFieldEnum)[keyof typeof ChatMessageScalarFieldEnum]


  export const SecurityLogScalarFieldEnum: {
    id: 'id',
    user_id: 'user_id',
    action: 'action',
    details: 'details',
    ip_address: 'ip_address',
    user_agent: 'user_agent',
    created_at: 'created_at'
  };

  export type SecurityLogScalarFieldEnum = (typeof SecurityLogScalarFieldEnum)[keyof typeof SecurityLogScalarFieldEnum]


  export const VerificationTokenScalarFieldEnum: {
    id: 'id',
    email: 'email',
    key: 'key',
    token: 'token',
    user_id: 'user_id',
    type: 'type',
    expires_at: 'expires_at',
    used: 'used',
    created_at: 'created_at'
  };

  export type VerificationTokenScalarFieldEnum = (typeof VerificationTokenScalarFieldEnum)[keyof typeof VerificationTokenScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'UserStatus'
   */
  export type EnumUserStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'UserStatus'>
    


  /**
   * Reference to a field of type 'UserStatus[]'
   */
  export type ListEnumUserStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'UserStatus[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'DocumentStatus'
   */
  export type EnumDocumentStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DocumentStatus'>
    


  /**
   * Reference to a field of type 'DocumentStatus[]'
   */
  export type ListEnumDocumentStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DocumentStatus[]'>
    


  /**
   * Reference to a field of type 'MessageRole'
   */
  export type EnumMessageRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'MessageRole'>
    


  /**
   * Reference to a field of type 'MessageRole[]'
   */
  export type ListEnumMessageRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'MessageRole[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'SecurityAction'
   */
  export type EnumSecurityActionFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SecurityAction'>
    


  /**
   * Reference to a field of type 'SecurityAction[]'
   */
  export type ListEnumSecurityActionFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SecurityAction[]'>
    


  /**
   * Reference to a field of type 'TokenType'
   */
  export type EnumTokenTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TokenType'>
    


  /**
   * Reference to a field of type 'TokenType[]'
   */
  export type ListEnumTokenTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TokenType[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: StringFilter<"User"> | string
    name?: StringNullableFilter<"User"> | string | null
    email?: StringFilter<"User"> | string
    password?: StringFilter<"User"> | string
    job_title?: StringNullableFilter<"User"> | string | null
    profile_picture?: StringNullableFilter<"User"> | string | null
    is_paid_user?: BoolFilter<"User"> | boolean
    two_factor_enabled?: BoolFilter<"User"> | boolean
    two_factor_secret?: StringNullableFilter<"User"> | string | null
    ai_personality?: StringNullableFilter<"User"> | string | null
    status?: EnumUserStatusFilter<"User"> | $Enums.UserStatus
    email_verified?: BoolFilter<"User"> | boolean
    created_at?: DateTimeFilter<"User"> | Date | string
    updated_at?: DateTimeFilter<"User"> | Date | string
    last_login_at?: DateTimeNullableFilter<"User"> | Date | string | null
    documents?: DocumentListRelationFilter
    chat_sessions?: ChatSessionListRelationFilter
    security_logs?: SecurityLogListRelationFilter
    verification_tokens?: VerificationTokenListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrderInput | SortOrder
    email?: SortOrder
    password?: SortOrder
    job_title?: SortOrderInput | SortOrder
    profile_picture?: SortOrderInput | SortOrder
    is_paid_user?: SortOrder
    two_factor_enabled?: SortOrder
    two_factor_secret?: SortOrderInput | SortOrder
    ai_personality?: SortOrderInput | SortOrder
    status?: SortOrder
    email_verified?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    last_login_at?: SortOrderInput | SortOrder
    documents?: DocumentOrderByRelationAggregateInput
    chat_sessions?: ChatSessionOrderByRelationAggregateInput
    security_logs?: SecurityLogOrderByRelationAggregateInput
    verification_tokens?: VerificationTokenOrderByRelationAggregateInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    email?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    name?: StringNullableFilter<"User"> | string | null
    password?: StringFilter<"User"> | string
    job_title?: StringNullableFilter<"User"> | string | null
    profile_picture?: StringNullableFilter<"User"> | string | null
    is_paid_user?: BoolFilter<"User"> | boolean
    two_factor_enabled?: BoolFilter<"User"> | boolean
    two_factor_secret?: StringNullableFilter<"User"> | string | null
    ai_personality?: StringNullableFilter<"User"> | string | null
    status?: EnumUserStatusFilter<"User"> | $Enums.UserStatus
    email_verified?: BoolFilter<"User"> | boolean
    created_at?: DateTimeFilter<"User"> | Date | string
    updated_at?: DateTimeFilter<"User"> | Date | string
    last_login_at?: DateTimeNullableFilter<"User"> | Date | string | null
    documents?: DocumentListRelationFilter
    chat_sessions?: ChatSessionListRelationFilter
    security_logs?: SecurityLogListRelationFilter
    verification_tokens?: VerificationTokenListRelationFilter
  }, "id" | "email">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrderInput | SortOrder
    email?: SortOrder
    password?: SortOrder
    job_title?: SortOrderInput | SortOrder
    profile_picture?: SortOrderInput | SortOrder
    is_paid_user?: SortOrder
    two_factor_enabled?: SortOrder
    two_factor_secret?: SortOrderInput | SortOrder
    ai_personality?: SortOrderInput | SortOrder
    status?: SortOrder
    email_verified?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    last_login_at?: SortOrderInput | SortOrder
    _count?: UserCountOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"User"> | string
    name?: StringNullableWithAggregatesFilter<"User"> | string | null
    email?: StringWithAggregatesFilter<"User"> | string
    password?: StringWithAggregatesFilter<"User"> | string
    job_title?: StringNullableWithAggregatesFilter<"User"> | string | null
    profile_picture?: StringNullableWithAggregatesFilter<"User"> | string | null
    is_paid_user?: BoolWithAggregatesFilter<"User"> | boolean
    two_factor_enabled?: BoolWithAggregatesFilter<"User"> | boolean
    two_factor_secret?: StringNullableWithAggregatesFilter<"User"> | string | null
    ai_personality?: StringNullableWithAggregatesFilter<"User"> | string | null
    status?: EnumUserStatusWithAggregatesFilter<"User"> | $Enums.UserStatus
    email_verified?: BoolWithAggregatesFilter<"User"> | boolean
    created_at?: DateTimeWithAggregatesFilter<"User"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"User"> | Date | string
    last_login_at?: DateTimeNullableWithAggregatesFilter<"User"> | Date | string | null
  }

  export type DocumentWhereInput = {
    AND?: DocumentWhereInput | DocumentWhereInput[]
    OR?: DocumentWhereInput[]
    NOT?: DocumentWhereInput | DocumentWhereInput[]
    id?: StringFilter<"Document"> | string
    file_name?: StringFilter<"Document"> | string
    original_file_name?: StringFilter<"Document"> | string
    file_path?: StringFilter<"Document"> | string
    file_size?: IntFilter<"Document"> | number
    mime_type?: StringFilter<"Document"> | string
    status?: EnumDocumentStatusFilter<"Document"> | $Enums.DocumentStatus
    is_scanned?: BoolNullableFilter<"Document"> | boolean | null
    page_count?: IntNullableFilter<"Document"> | number | null
    owner_id?: StringFilter<"Document"> | string
    uploaded_at?: DateTimeFilter<"Document"> | Date | string
    updated_at?: DateTimeFilter<"Document"> | Date | string
    owner?: XOR<UserScalarRelationFilter, UserWhereInput>
    chat_sessions?: ChatSessionListRelationFilter
  }

  export type DocumentOrderByWithRelationInput = {
    id?: SortOrder
    file_name?: SortOrder
    original_file_name?: SortOrder
    file_path?: SortOrder
    file_size?: SortOrder
    mime_type?: SortOrder
    status?: SortOrder
    is_scanned?: SortOrderInput | SortOrder
    page_count?: SortOrderInput | SortOrder
    owner_id?: SortOrder
    uploaded_at?: SortOrder
    updated_at?: SortOrder
    owner?: UserOrderByWithRelationInput
    chat_sessions?: ChatSessionOrderByRelationAggregateInput
  }

  export type DocumentWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: DocumentWhereInput | DocumentWhereInput[]
    OR?: DocumentWhereInput[]
    NOT?: DocumentWhereInput | DocumentWhereInput[]
    file_name?: StringFilter<"Document"> | string
    original_file_name?: StringFilter<"Document"> | string
    file_path?: StringFilter<"Document"> | string
    file_size?: IntFilter<"Document"> | number
    mime_type?: StringFilter<"Document"> | string
    status?: EnumDocumentStatusFilter<"Document"> | $Enums.DocumentStatus
    is_scanned?: BoolNullableFilter<"Document"> | boolean | null
    page_count?: IntNullableFilter<"Document"> | number | null
    owner_id?: StringFilter<"Document"> | string
    uploaded_at?: DateTimeFilter<"Document"> | Date | string
    updated_at?: DateTimeFilter<"Document"> | Date | string
    owner?: XOR<UserScalarRelationFilter, UserWhereInput>
    chat_sessions?: ChatSessionListRelationFilter
  }, "id">

  export type DocumentOrderByWithAggregationInput = {
    id?: SortOrder
    file_name?: SortOrder
    original_file_name?: SortOrder
    file_path?: SortOrder
    file_size?: SortOrder
    mime_type?: SortOrder
    status?: SortOrder
    is_scanned?: SortOrderInput | SortOrder
    page_count?: SortOrderInput | SortOrder
    owner_id?: SortOrder
    uploaded_at?: SortOrder
    updated_at?: SortOrder
    _count?: DocumentCountOrderByAggregateInput
    _avg?: DocumentAvgOrderByAggregateInput
    _max?: DocumentMaxOrderByAggregateInput
    _min?: DocumentMinOrderByAggregateInput
    _sum?: DocumentSumOrderByAggregateInput
  }

  export type DocumentScalarWhereWithAggregatesInput = {
    AND?: DocumentScalarWhereWithAggregatesInput | DocumentScalarWhereWithAggregatesInput[]
    OR?: DocumentScalarWhereWithAggregatesInput[]
    NOT?: DocumentScalarWhereWithAggregatesInput | DocumentScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Document"> | string
    file_name?: StringWithAggregatesFilter<"Document"> | string
    original_file_name?: StringWithAggregatesFilter<"Document"> | string
    file_path?: StringWithAggregatesFilter<"Document"> | string
    file_size?: IntWithAggregatesFilter<"Document"> | number
    mime_type?: StringWithAggregatesFilter<"Document"> | string
    status?: EnumDocumentStatusWithAggregatesFilter<"Document"> | $Enums.DocumentStatus
    is_scanned?: BoolNullableWithAggregatesFilter<"Document"> | boolean | null
    page_count?: IntNullableWithAggregatesFilter<"Document"> | number | null
    owner_id?: StringWithAggregatesFilter<"Document"> | string
    uploaded_at?: DateTimeWithAggregatesFilter<"Document"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"Document"> | Date | string
  }

  export type ChatSessionWhereInput = {
    AND?: ChatSessionWhereInput | ChatSessionWhereInput[]
    OR?: ChatSessionWhereInput[]
    NOT?: ChatSessionWhereInput | ChatSessionWhereInput[]
    id?: StringFilter<"ChatSession"> | string
    title?: StringNullableFilter<"ChatSession"> | string | null
    user_id?: StringFilter<"ChatSession"> | string
    document_id?: StringFilter<"ChatSession"> | string
    is_saved?: BoolFilter<"ChatSession"> | boolean
    created_at?: DateTimeFilter<"ChatSession"> | Date | string
    updated_at?: DateTimeFilter<"ChatSession"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    document?: XOR<DocumentScalarRelationFilter, DocumentWhereInput>
    messages?: ChatMessageListRelationFilter
  }

  export type ChatSessionOrderByWithRelationInput = {
    id?: SortOrder
    title?: SortOrderInput | SortOrder
    user_id?: SortOrder
    document_id?: SortOrder
    is_saved?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    user?: UserOrderByWithRelationInput
    document?: DocumentOrderByWithRelationInput
    messages?: ChatMessageOrderByRelationAggregateInput
  }

  export type ChatSessionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ChatSessionWhereInput | ChatSessionWhereInput[]
    OR?: ChatSessionWhereInput[]
    NOT?: ChatSessionWhereInput | ChatSessionWhereInput[]
    title?: StringNullableFilter<"ChatSession"> | string | null
    user_id?: StringFilter<"ChatSession"> | string
    document_id?: StringFilter<"ChatSession"> | string
    is_saved?: BoolFilter<"ChatSession"> | boolean
    created_at?: DateTimeFilter<"ChatSession"> | Date | string
    updated_at?: DateTimeFilter<"ChatSession"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    document?: XOR<DocumentScalarRelationFilter, DocumentWhereInput>
    messages?: ChatMessageListRelationFilter
  }, "id">

  export type ChatSessionOrderByWithAggregationInput = {
    id?: SortOrder
    title?: SortOrderInput | SortOrder
    user_id?: SortOrder
    document_id?: SortOrder
    is_saved?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    _count?: ChatSessionCountOrderByAggregateInput
    _max?: ChatSessionMaxOrderByAggregateInput
    _min?: ChatSessionMinOrderByAggregateInput
  }

  export type ChatSessionScalarWhereWithAggregatesInput = {
    AND?: ChatSessionScalarWhereWithAggregatesInput | ChatSessionScalarWhereWithAggregatesInput[]
    OR?: ChatSessionScalarWhereWithAggregatesInput[]
    NOT?: ChatSessionScalarWhereWithAggregatesInput | ChatSessionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ChatSession"> | string
    title?: StringNullableWithAggregatesFilter<"ChatSession"> | string | null
    user_id?: StringWithAggregatesFilter<"ChatSession"> | string
    document_id?: StringWithAggregatesFilter<"ChatSession"> | string
    is_saved?: BoolWithAggregatesFilter<"ChatSession"> | boolean
    created_at?: DateTimeWithAggregatesFilter<"ChatSession"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"ChatSession"> | Date | string
  }

  export type ChatMessageWhereInput = {
    AND?: ChatMessageWhereInput | ChatMessageWhereInput[]
    OR?: ChatMessageWhereInput[]
    NOT?: ChatMessageWhereInput | ChatMessageWhereInput[]
    id?: StringFilter<"ChatMessage"> | string
    session_id?: StringFilter<"ChatMessage"> | string
    role?: EnumMessageRoleFilter<"ChatMessage"> | $Enums.MessageRole
    content?: StringFilter<"ChatMessage"> | string
    source_nodes?: JsonNullableFilter<"ChatMessage">
    tokens_used?: IntNullableFilter<"ChatMessage"> | number | null
    created_at?: DateTimeFilter<"ChatMessage"> | Date | string
    session?: XOR<ChatSessionScalarRelationFilter, ChatSessionWhereInput>
  }

  export type ChatMessageOrderByWithRelationInput = {
    id?: SortOrder
    session_id?: SortOrder
    role?: SortOrder
    content?: SortOrder
    source_nodes?: SortOrderInput | SortOrder
    tokens_used?: SortOrderInput | SortOrder
    created_at?: SortOrder
    session?: ChatSessionOrderByWithRelationInput
  }

  export type ChatMessageWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ChatMessageWhereInput | ChatMessageWhereInput[]
    OR?: ChatMessageWhereInput[]
    NOT?: ChatMessageWhereInput | ChatMessageWhereInput[]
    session_id?: StringFilter<"ChatMessage"> | string
    role?: EnumMessageRoleFilter<"ChatMessage"> | $Enums.MessageRole
    content?: StringFilter<"ChatMessage"> | string
    source_nodes?: JsonNullableFilter<"ChatMessage">
    tokens_used?: IntNullableFilter<"ChatMessage"> | number | null
    created_at?: DateTimeFilter<"ChatMessage"> | Date | string
    session?: XOR<ChatSessionScalarRelationFilter, ChatSessionWhereInput>
  }, "id">

  export type ChatMessageOrderByWithAggregationInput = {
    id?: SortOrder
    session_id?: SortOrder
    role?: SortOrder
    content?: SortOrder
    source_nodes?: SortOrderInput | SortOrder
    tokens_used?: SortOrderInput | SortOrder
    created_at?: SortOrder
    _count?: ChatMessageCountOrderByAggregateInput
    _avg?: ChatMessageAvgOrderByAggregateInput
    _max?: ChatMessageMaxOrderByAggregateInput
    _min?: ChatMessageMinOrderByAggregateInput
    _sum?: ChatMessageSumOrderByAggregateInput
  }

  export type ChatMessageScalarWhereWithAggregatesInput = {
    AND?: ChatMessageScalarWhereWithAggregatesInput | ChatMessageScalarWhereWithAggregatesInput[]
    OR?: ChatMessageScalarWhereWithAggregatesInput[]
    NOT?: ChatMessageScalarWhereWithAggregatesInput | ChatMessageScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ChatMessage"> | string
    session_id?: StringWithAggregatesFilter<"ChatMessage"> | string
    role?: EnumMessageRoleWithAggregatesFilter<"ChatMessage"> | $Enums.MessageRole
    content?: StringWithAggregatesFilter<"ChatMessage"> | string
    source_nodes?: JsonNullableWithAggregatesFilter<"ChatMessage">
    tokens_used?: IntNullableWithAggregatesFilter<"ChatMessage"> | number | null
    created_at?: DateTimeWithAggregatesFilter<"ChatMessage"> | Date | string
  }

  export type SecurityLogWhereInput = {
    AND?: SecurityLogWhereInput | SecurityLogWhereInput[]
    OR?: SecurityLogWhereInput[]
    NOT?: SecurityLogWhereInput | SecurityLogWhereInput[]
    id?: StringFilter<"SecurityLog"> | string
    user_id?: StringFilter<"SecurityLog"> | string
    action?: EnumSecurityActionFilter<"SecurityLog"> | $Enums.SecurityAction
    details?: StringNullableFilter<"SecurityLog"> | string | null
    ip_address?: StringNullableFilter<"SecurityLog"> | string | null
    user_agent?: StringNullableFilter<"SecurityLog"> | string | null
    created_at?: DateTimeFilter<"SecurityLog"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type SecurityLogOrderByWithRelationInput = {
    id?: SortOrder
    user_id?: SortOrder
    action?: SortOrder
    details?: SortOrderInput | SortOrder
    ip_address?: SortOrderInput | SortOrder
    user_agent?: SortOrderInput | SortOrder
    created_at?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type SecurityLogWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: SecurityLogWhereInput | SecurityLogWhereInput[]
    OR?: SecurityLogWhereInput[]
    NOT?: SecurityLogWhereInput | SecurityLogWhereInput[]
    user_id?: StringFilter<"SecurityLog"> | string
    action?: EnumSecurityActionFilter<"SecurityLog"> | $Enums.SecurityAction
    details?: StringNullableFilter<"SecurityLog"> | string | null
    ip_address?: StringNullableFilter<"SecurityLog"> | string | null
    user_agent?: StringNullableFilter<"SecurityLog"> | string | null
    created_at?: DateTimeFilter<"SecurityLog"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id">

  export type SecurityLogOrderByWithAggregationInput = {
    id?: SortOrder
    user_id?: SortOrder
    action?: SortOrder
    details?: SortOrderInput | SortOrder
    ip_address?: SortOrderInput | SortOrder
    user_agent?: SortOrderInput | SortOrder
    created_at?: SortOrder
    _count?: SecurityLogCountOrderByAggregateInput
    _max?: SecurityLogMaxOrderByAggregateInput
    _min?: SecurityLogMinOrderByAggregateInput
  }

  export type SecurityLogScalarWhereWithAggregatesInput = {
    AND?: SecurityLogScalarWhereWithAggregatesInput | SecurityLogScalarWhereWithAggregatesInput[]
    OR?: SecurityLogScalarWhereWithAggregatesInput[]
    NOT?: SecurityLogScalarWhereWithAggregatesInput | SecurityLogScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"SecurityLog"> | string
    user_id?: StringWithAggregatesFilter<"SecurityLog"> | string
    action?: EnumSecurityActionWithAggregatesFilter<"SecurityLog"> | $Enums.SecurityAction
    details?: StringNullableWithAggregatesFilter<"SecurityLog"> | string | null
    ip_address?: StringNullableWithAggregatesFilter<"SecurityLog"> | string | null
    user_agent?: StringNullableWithAggregatesFilter<"SecurityLog"> | string | null
    created_at?: DateTimeWithAggregatesFilter<"SecurityLog"> | Date | string
  }

  export type VerificationTokenWhereInput = {
    AND?: VerificationTokenWhereInput | VerificationTokenWhereInput[]
    OR?: VerificationTokenWhereInput[]
    NOT?: VerificationTokenWhereInput | VerificationTokenWhereInput[]
    id?: StringFilter<"VerificationToken"> | string
    email?: StringFilter<"VerificationToken"> | string
    key?: StringFilter<"VerificationToken"> | string
    token?: StringFilter<"VerificationToken"> | string
    user_id?: StringNullableFilter<"VerificationToken"> | string | null
    type?: EnumTokenTypeFilter<"VerificationToken"> | $Enums.TokenType
    expires_at?: DateTimeFilter<"VerificationToken"> | Date | string
    used?: BoolFilter<"VerificationToken"> | boolean
    created_at?: DateTimeFilter<"VerificationToken"> | Date | string
    user?: XOR<UserNullableScalarRelationFilter, UserWhereInput> | null
  }

  export type VerificationTokenOrderByWithRelationInput = {
    id?: SortOrder
    email?: SortOrder
    key?: SortOrder
    token?: SortOrder
    user_id?: SortOrderInput | SortOrder
    type?: SortOrder
    expires_at?: SortOrder
    used?: SortOrder
    created_at?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type VerificationTokenWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    token?: string
    AND?: VerificationTokenWhereInput | VerificationTokenWhereInput[]
    OR?: VerificationTokenWhereInput[]
    NOT?: VerificationTokenWhereInput | VerificationTokenWhereInput[]
    email?: StringFilter<"VerificationToken"> | string
    key?: StringFilter<"VerificationToken"> | string
    user_id?: StringNullableFilter<"VerificationToken"> | string | null
    type?: EnumTokenTypeFilter<"VerificationToken"> | $Enums.TokenType
    expires_at?: DateTimeFilter<"VerificationToken"> | Date | string
    used?: BoolFilter<"VerificationToken"> | boolean
    created_at?: DateTimeFilter<"VerificationToken"> | Date | string
    user?: XOR<UserNullableScalarRelationFilter, UserWhereInput> | null
  }, "id" | "token">

  export type VerificationTokenOrderByWithAggregationInput = {
    id?: SortOrder
    email?: SortOrder
    key?: SortOrder
    token?: SortOrder
    user_id?: SortOrderInput | SortOrder
    type?: SortOrder
    expires_at?: SortOrder
    used?: SortOrder
    created_at?: SortOrder
    _count?: VerificationTokenCountOrderByAggregateInput
    _max?: VerificationTokenMaxOrderByAggregateInput
    _min?: VerificationTokenMinOrderByAggregateInput
  }

  export type VerificationTokenScalarWhereWithAggregatesInput = {
    AND?: VerificationTokenScalarWhereWithAggregatesInput | VerificationTokenScalarWhereWithAggregatesInput[]
    OR?: VerificationTokenScalarWhereWithAggregatesInput[]
    NOT?: VerificationTokenScalarWhereWithAggregatesInput | VerificationTokenScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"VerificationToken"> | string
    email?: StringWithAggregatesFilter<"VerificationToken"> | string
    key?: StringWithAggregatesFilter<"VerificationToken"> | string
    token?: StringWithAggregatesFilter<"VerificationToken"> | string
    user_id?: StringNullableWithAggregatesFilter<"VerificationToken"> | string | null
    type?: EnumTokenTypeWithAggregatesFilter<"VerificationToken"> | $Enums.TokenType
    expires_at?: DateTimeWithAggregatesFilter<"VerificationToken"> | Date | string
    used?: BoolWithAggregatesFilter<"VerificationToken"> | boolean
    created_at?: DateTimeWithAggregatesFilter<"VerificationToken"> | Date | string
  }

  export type UserCreateInput = {
    id?: string
    name?: string | null
    email: string
    password: string
    job_title?: string | null
    profile_picture?: string | null
    is_paid_user?: boolean
    two_factor_enabled?: boolean
    two_factor_secret?: string | null
    ai_personality?: string | null
    status?: $Enums.UserStatus
    email_verified?: boolean
    created_at?: Date | string
    updated_at?: Date | string
    last_login_at?: Date | string | null
    documents?: DocumentCreateNestedManyWithoutOwnerInput
    chat_sessions?: ChatSessionCreateNestedManyWithoutUserInput
    security_logs?: SecurityLogCreateNestedManyWithoutUserInput
    verification_tokens?: VerificationTokenCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateInput = {
    id?: string
    name?: string | null
    email: string
    password: string
    job_title?: string | null
    profile_picture?: string | null
    is_paid_user?: boolean
    two_factor_enabled?: boolean
    two_factor_secret?: string | null
    ai_personality?: string | null
    status?: $Enums.UserStatus
    email_verified?: boolean
    created_at?: Date | string
    updated_at?: Date | string
    last_login_at?: Date | string | null
    documents?: DocumentUncheckedCreateNestedManyWithoutOwnerInput
    chat_sessions?: ChatSessionUncheckedCreateNestedManyWithoutUserInput
    security_logs?: SecurityLogUncheckedCreateNestedManyWithoutUserInput
    verification_tokens?: VerificationTokenUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    job_title?: NullableStringFieldUpdateOperationsInput | string | null
    profile_picture?: NullableStringFieldUpdateOperationsInput | string | null
    is_paid_user?: BoolFieldUpdateOperationsInput | boolean
    two_factor_enabled?: BoolFieldUpdateOperationsInput | boolean
    two_factor_secret?: NullableStringFieldUpdateOperationsInput | string | null
    ai_personality?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumUserStatusFieldUpdateOperationsInput | $Enums.UserStatus
    email_verified?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    last_login_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    documents?: DocumentUpdateManyWithoutOwnerNestedInput
    chat_sessions?: ChatSessionUpdateManyWithoutUserNestedInput
    security_logs?: SecurityLogUpdateManyWithoutUserNestedInput
    verification_tokens?: VerificationTokenUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    job_title?: NullableStringFieldUpdateOperationsInput | string | null
    profile_picture?: NullableStringFieldUpdateOperationsInput | string | null
    is_paid_user?: BoolFieldUpdateOperationsInput | boolean
    two_factor_enabled?: BoolFieldUpdateOperationsInput | boolean
    two_factor_secret?: NullableStringFieldUpdateOperationsInput | string | null
    ai_personality?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumUserStatusFieldUpdateOperationsInput | $Enums.UserStatus
    email_verified?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    last_login_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    documents?: DocumentUncheckedUpdateManyWithoutOwnerNestedInput
    chat_sessions?: ChatSessionUncheckedUpdateManyWithoutUserNestedInput
    security_logs?: SecurityLogUncheckedUpdateManyWithoutUserNestedInput
    verification_tokens?: VerificationTokenUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateManyInput = {
    id?: string
    name?: string | null
    email: string
    password: string
    job_title?: string | null
    profile_picture?: string | null
    is_paid_user?: boolean
    two_factor_enabled?: boolean
    two_factor_secret?: string | null
    ai_personality?: string | null
    status?: $Enums.UserStatus
    email_verified?: boolean
    created_at?: Date | string
    updated_at?: Date | string
    last_login_at?: Date | string | null
  }

  export type UserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    job_title?: NullableStringFieldUpdateOperationsInput | string | null
    profile_picture?: NullableStringFieldUpdateOperationsInput | string | null
    is_paid_user?: BoolFieldUpdateOperationsInput | boolean
    two_factor_enabled?: BoolFieldUpdateOperationsInput | boolean
    two_factor_secret?: NullableStringFieldUpdateOperationsInput | string | null
    ai_personality?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumUserStatusFieldUpdateOperationsInput | $Enums.UserStatus
    email_verified?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    last_login_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type UserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    job_title?: NullableStringFieldUpdateOperationsInput | string | null
    profile_picture?: NullableStringFieldUpdateOperationsInput | string | null
    is_paid_user?: BoolFieldUpdateOperationsInput | boolean
    two_factor_enabled?: BoolFieldUpdateOperationsInput | boolean
    two_factor_secret?: NullableStringFieldUpdateOperationsInput | string | null
    ai_personality?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumUserStatusFieldUpdateOperationsInput | $Enums.UserStatus
    email_verified?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    last_login_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type DocumentCreateInput = {
    id?: string
    file_name: string
    original_file_name: string
    file_path: string
    file_size: number
    mime_type: string
    status?: $Enums.DocumentStatus
    is_scanned?: boolean | null
    page_count?: number | null
    uploaded_at?: Date | string
    updated_at?: Date | string
    owner: UserCreateNestedOneWithoutDocumentsInput
    chat_sessions?: ChatSessionCreateNestedManyWithoutDocumentInput
  }

  export type DocumentUncheckedCreateInput = {
    id?: string
    file_name: string
    original_file_name: string
    file_path: string
    file_size: number
    mime_type: string
    status?: $Enums.DocumentStatus
    is_scanned?: boolean | null
    page_count?: number | null
    owner_id: string
    uploaded_at?: Date | string
    updated_at?: Date | string
    chat_sessions?: ChatSessionUncheckedCreateNestedManyWithoutDocumentInput
  }

  export type DocumentUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    file_name?: StringFieldUpdateOperationsInput | string
    original_file_name?: StringFieldUpdateOperationsInput | string
    file_path?: StringFieldUpdateOperationsInput | string
    file_size?: IntFieldUpdateOperationsInput | number
    mime_type?: StringFieldUpdateOperationsInput | string
    status?: EnumDocumentStatusFieldUpdateOperationsInput | $Enums.DocumentStatus
    is_scanned?: NullableBoolFieldUpdateOperationsInput | boolean | null
    page_count?: NullableIntFieldUpdateOperationsInput | number | null
    uploaded_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    owner?: UserUpdateOneRequiredWithoutDocumentsNestedInput
    chat_sessions?: ChatSessionUpdateManyWithoutDocumentNestedInput
  }

  export type DocumentUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    file_name?: StringFieldUpdateOperationsInput | string
    original_file_name?: StringFieldUpdateOperationsInput | string
    file_path?: StringFieldUpdateOperationsInput | string
    file_size?: IntFieldUpdateOperationsInput | number
    mime_type?: StringFieldUpdateOperationsInput | string
    status?: EnumDocumentStatusFieldUpdateOperationsInput | $Enums.DocumentStatus
    is_scanned?: NullableBoolFieldUpdateOperationsInput | boolean | null
    page_count?: NullableIntFieldUpdateOperationsInput | number | null
    owner_id?: StringFieldUpdateOperationsInput | string
    uploaded_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    chat_sessions?: ChatSessionUncheckedUpdateManyWithoutDocumentNestedInput
  }

  export type DocumentCreateManyInput = {
    id?: string
    file_name: string
    original_file_name: string
    file_path: string
    file_size: number
    mime_type: string
    status?: $Enums.DocumentStatus
    is_scanned?: boolean | null
    page_count?: number | null
    owner_id: string
    uploaded_at?: Date | string
    updated_at?: Date | string
  }

  export type DocumentUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    file_name?: StringFieldUpdateOperationsInput | string
    original_file_name?: StringFieldUpdateOperationsInput | string
    file_path?: StringFieldUpdateOperationsInput | string
    file_size?: IntFieldUpdateOperationsInput | number
    mime_type?: StringFieldUpdateOperationsInput | string
    status?: EnumDocumentStatusFieldUpdateOperationsInput | $Enums.DocumentStatus
    is_scanned?: NullableBoolFieldUpdateOperationsInput | boolean | null
    page_count?: NullableIntFieldUpdateOperationsInput | number | null
    uploaded_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DocumentUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    file_name?: StringFieldUpdateOperationsInput | string
    original_file_name?: StringFieldUpdateOperationsInput | string
    file_path?: StringFieldUpdateOperationsInput | string
    file_size?: IntFieldUpdateOperationsInput | number
    mime_type?: StringFieldUpdateOperationsInput | string
    status?: EnumDocumentStatusFieldUpdateOperationsInput | $Enums.DocumentStatus
    is_scanned?: NullableBoolFieldUpdateOperationsInput | boolean | null
    page_count?: NullableIntFieldUpdateOperationsInput | number | null
    owner_id?: StringFieldUpdateOperationsInput | string
    uploaded_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChatSessionCreateInput = {
    id?: string
    title?: string | null
    is_saved?: boolean
    created_at?: Date | string
    updated_at?: Date | string
    user: UserCreateNestedOneWithoutChat_sessionsInput
    document: DocumentCreateNestedOneWithoutChat_sessionsInput
    messages?: ChatMessageCreateNestedManyWithoutSessionInput
  }

  export type ChatSessionUncheckedCreateInput = {
    id?: string
    title?: string | null
    user_id: string
    document_id: string
    is_saved?: boolean
    created_at?: Date | string
    updated_at?: Date | string
    messages?: ChatMessageUncheckedCreateNestedManyWithoutSessionInput
  }

  export type ChatSessionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    is_saved?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutChat_sessionsNestedInput
    document?: DocumentUpdateOneRequiredWithoutChat_sessionsNestedInput
    messages?: ChatMessageUpdateManyWithoutSessionNestedInput
  }

  export type ChatSessionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    user_id?: StringFieldUpdateOperationsInput | string
    document_id?: StringFieldUpdateOperationsInput | string
    is_saved?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    messages?: ChatMessageUncheckedUpdateManyWithoutSessionNestedInput
  }

  export type ChatSessionCreateManyInput = {
    id?: string
    title?: string | null
    user_id: string
    document_id: string
    is_saved?: boolean
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type ChatSessionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    is_saved?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChatSessionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    user_id?: StringFieldUpdateOperationsInput | string
    document_id?: StringFieldUpdateOperationsInput | string
    is_saved?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChatMessageCreateInput = {
    id?: string
    role: $Enums.MessageRole
    content: string
    source_nodes?: NullableJsonNullValueInput | InputJsonValue
    tokens_used?: number | null
    created_at?: Date | string
    session: ChatSessionCreateNestedOneWithoutMessagesInput
  }

  export type ChatMessageUncheckedCreateInput = {
    id?: string
    session_id: string
    role: $Enums.MessageRole
    content: string
    source_nodes?: NullableJsonNullValueInput | InputJsonValue
    tokens_used?: number | null
    created_at?: Date | string
  }

  export type ChatMessageUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: EnumMessageRoleFieldUpdateOperationsInput | $Enums.MessageRole
    content?: StringFieldUpdateOperationsInput | string
    source_nodes?: NullableJsonNullValueInput | InputJsonValue
    tokens_used?: NullableIntFieldUpdateOperationsInput | number | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    session?: ChatSessionUpdateOneRequiredWithoutMessagesNestedInput
  }

  export type ChatMessageUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    session_id?: StringFieldUpdateOperationsInput | string
    role?: EnumMessageRoleFieldUpdateOperationsInput | $Enums.MessageRole
    content?: StringFieldUpdateOperationsInput | string
    source_nodes?: NullableJsonNullValueInput | InputJsonValue
    tokens_used?: NullableIntFieldUpdateOperationsInput | number | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChatMessageCreateManyInput = {
    id?: string
    session_id: string
    role: $Enums.MessageRole
    content: string
    source_nodes?: NullableJsonNullValueInput | InputJsonValue
    tokens_used?: number | null
    created_at?: Date | string
  }

  export type ChatMessageUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: EnumMessageRoleFieldUpdateOperationsInput | $Enums.MessageRole
    content?: StringFieldUpdateOperationsInput | string
    source_nodes?: NullableJsonNullValueInput | InputJsonValue
    tokens_used?: NullableIntFieldUpdateOperationsInput | number | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChatMessageUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    session_id?: StringFieldUpdateOperationsInput | string
    role?: EnumMessageRoleFieldUpdateOperationsInput | $Enums.MessageRole
    content?: StringFieldUpdateOperationsInput | string
    source_nodes?: NullableJsonNullValueInput | InputJsonValue
    tokens_used?: NullableIntFieldUpdateOperationsInput | number | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SecurityLogCreateInput = {
    id?: string
    action: $Enums.SecurityAction
    details?: string | null
    ip_address?: string | null
    user_agent?: string | null
    created_at?: Date | string
    user: UserCreateNestedOneWithoutSecurity_logsInput
  }

  export type SecurityLogUncheckedCreateInput = {
    id?: string
    user_id: string
    action: $Enums.SecurityAction
    details?: string | null
    ip_address?: string | null
    user_agent?: string | null
    created_at?: Date | string
  }

  export type SecurityLogUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    action?: EnumSecurityActionFieldUpdateOperationsInput | $Enums.SecurityAction
    details?: NullableStringFieldUpdateOperationsInput | string | null
    ip_address?: NullableStringFieldUpdateOperationsInput | string | null
    user_agent?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutSecurity_logsNestedInput
  }

  export type SecurityLogUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    action?: EnumSecurityActionFieldUpdateOperationsInput | $Enums.SecurityAction
    details?: NullableStringFieldUpdateOperationsInput | string | null
    ip_address?: NullableStringFieldUpdateOperationsInput | string | null
    user_agent?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SecurityLogCreateManyInput = {
    id?: string
    user_id: string
    action: $Enums.SecurityAction
    details?: string | null
    ip_address?: string | null
    user_agent?: string | null
    created_at?: Date | string
  }

  export type SecurityLogUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    action?: EnumSecurityActionFieldUpdateOperationsInput | $Enums.SecurityAction
    details?: NullableStringFieldUpdateOperationsInput | string | null
    ip_address?: NullableStringFieldUpdateOperationsInput | string | null
    user_agent?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SecurityLogUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    action?: EnumSecurityActionFieldUpdateOperationsInput | $Enums.SecurityAction
    details?: NullableStringFieldUpdateOperationsInput | string | null
    ip_address?: NullableStringFieldUpdateOperationsInput | string | null
    user_agent?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VerificationTokenCreateInput = {
    id?: string
    email: string
    key: string
    token: string
    type?: $Enums.TokenType
    expires_at: Date | string
    used?: boolean
    created_at?: Date | string
    user?: UserCreateNestedOneWithoutVerification_tokensInput
  }

  export type VerificationTokenUncheckedCreateInput = {
    id?: string
    email: string
    key: string
    token: string
    user_id?: string | null
    type?: $Enums.TokenType
    expires_at: Date | string
    used?: boolean
    created_at?: Date | string
  }

  export type VerificationTokenUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    type?: EnumTokenTypeFieldUpdateOperationsInput | $Enums.TokenType
    expires_at?: DateTimeFieldUpdateOperationsInput | Date | string
    used?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneWithoutVerification_tokensNestedInput
  }

  export type VerificationTokenUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    user_id?: NullableStringFieldUpdateOperationsInput | string | null
    type?: EnumTokenTypeFieldUpdateOperationsInput | $Enums.TokenType
    expires_at?: DateTimeFieldUpdateOperationsInput | Date | string
    used?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VerificationTokenCreateManyInput = {
    id?: string
    email: string
    key: string
    token: string
    user_id?: string | null
    type?: $Enums.TokenType
    expires_at: Date | string
    used?: boolean
    created_at?: Date | string
  }

  export type VerificationTokenUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    type?: EnumTokenTypeFieldUpdateOperationsInput | $Enums.TokenType
    expires_at?: DateTimeFieldUpdateOperationsInput | Date | string
    used?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VerificationTokenUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    user_id?: NullableStringFieldUpdateOperationsInput | string | null
    type?: EnumTokenTypeFieldUpdateOperationsInput | $Enums.TokenType
    expires_at?: DateTimeFieldUpdateOperationsInput | Date | string
    used?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type EnumUserStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.UserStatus | EnumUserStatusFieldRefInput<$PrismaModel>
    in?: $Enums.UserStatus[] | ListEnumUserStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.UserStatus[] | ListEnumUserStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumUserStatusFilter<$PrismaModel> | $Enums.UserStatus
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type DocumentListRelationFilter = {
    every?: DocumentWhereInput
    some?: DocumentWhereInput
    none?: DocumentWhereInput
  }

  export type ChatSessionListRelationFilter = {
    every?: ChatSessionWhereInput
    some?: ChatSessionWhereInput
    none?: ChatSessionWhereInput
  }

  export type SecurityLogListRelationFilter = {
    every?: SecurityLogWhereInput
    some?: SecurityLogWhereInput
    none?: SecurityLogWhereInput
  }

  export type VerificationTokenListRelationFilter = {
    every?: VerificationTokenWhereInput
    some?: VerificationTokenWhereInput
    none?: VerificationTokenWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type DocumentOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ChatSessionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type SecurityLogOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type VerificationTokenOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    password?: SortOrder
    job_title?: SortOrder
    profile_picture?: SortOrder
    is_paid_user?: SortOrder
    two_factor_enabled?: SortOrder
    two_factor_secret?: SortOrder
    ai_personality?: SortOrder
    status?: SortOrder
    email_verified?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    last_login_at?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    password?: SortOrder
    job_title?: SortOrder
    profile_picture?: SortOrder
    is_paid_user?: SortOrder
    two_factor_enabled?: SortOrder
    two_factor_secret?: SortOrder
    ai_personality?: SortOrder
    status?: SortOrder
    email_verified?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    last_login_at?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    password?: SortOrder
    job_title?: SortOrder
    profile_picture?: SortOrder
    is_paid_user?: SortOrder
    two_factor_enabled?: SortOrder
    two_factor_secret?: SortOrder
    ai_personality?: SortOrder
    status?: SortOrder
    email_verified?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    last_login_at?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type EnumUserStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.UserStatus | EnumUserStatusFieldRefInput<$PrismaModel>
    in?: $Enums.UserStatus[] | ListEnumUserStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.UserStatus[] | ListEnumUserStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumUserStatusWithAggregatesFilter<$PrismaModel> | $Enums.UserStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumUserStatusFilter<$PrismaModel>
    _max?: NestedEnumUserStatusFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type EnumDocumentStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.DocumentStatus | EnumDocumentStatusFieldRefInput<$PrismaModel>
    in?: $Enums.DocumentStatus[] | ListEnumDocumentStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.DocumentStatus[] | ListEnumDocumentStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumDocumentStatusFilter<$PrismaModel> | $Enums.DocumentStatus
  }

  export type BoolNullableFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableFilter<$PrismaModel> | boolean | null
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type UserScalarRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type DocumentCountOrderByAggregateInput = {
    id?: SortOrder
    file_name?: SortOrder
    original_file_name?: SortOrder
    file_path?: SortOrder
    file_size?: SortOrder
    mime_type?: SortOrder
    status?: SortOrder
    is_scanned?: SortOrder
    page_count?: SortOrder
    owner_id?: SortOrder
    uploaded_at?: SortOrder
    updated_at?: SortOrder
  }

  export type DocumentAvgOrderByAggregateInput = {
    file_size?: SortOrder
    page_count?: SortOrder
  }

  export type DocumentMaxOrderByAggregateInput = {
    id?: SortOrder
    file_name?: SortOrder
    original_file_name?: SortOrder
    file_path?: SortOrder
    file_size?: SortOrder
    mime_type?: SortOrder
    status?: SortOrder
    is_scanned?: SortOrder
    page_count?: SortOrder
    owner_id?: SortOrder
    uploaded_at?: SortOrder
    updated_at?: SortOrder
  }

  export type DocumentMinOrderByAggregateInput = {
    id?: SortOrder
    file_name?: SortOrder
    original_file_name?: SortOrder
    file_path?: SortOrder
    file_size?: SortOrder
    mime_type?: SortOrder
    status?: SortOrder
    is_scanned?: SortOrder
    page_count?: SortOrder
    owner_id?: SortOrder
    uploaded_at?: SortOrder
    updated_at?: SortOrder
  }

  export type DocumentSumOrderByAggregateInput = {
    file_size?: SortOrder
    page_count?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type EnumDocumentStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.DocumentStatus | EnumDocumentStatusFieldRefInput<$PrismaModel>
    in?: $Enums.DocumentStatus[] | ListEnumDocumentStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.DocumentStatus[] | ListEnumDocumentStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumDocumentStatusWithAggregatesFilter<$PrismaModel> | $Enums.DocumentStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumDocumentStatusFilter<$PrismaModel>
    _max?: NestedEnumDocumentStatusFilter<$PrismaModel>
  }

  export type BoolNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableWithAggregatesFilter<$PrismaModel> | boolean | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedBoolNullableFilter<$PrismaModel>
    _max?: NestedBoolNullableFilter<$PrismaModel>
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type DocumentScalarRelationFilter = {
    is?: DocumentWhereInput
    isNot?: DocumentWhereInput
  }

  export type ChatMessageListRelationFilter = {
    every?: ChatMessageWhereInput
    some?: ChatMessageWhereInput
    none?: ChatMessageWhereInput
  }

  export type ChatMessageOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ChatSessionCountOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    user_id?: SortOrder
    document_id?: SortOrder
    is_saved?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type ChatSessionMaxOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    user_id?: SortOrder
    document_id?: SortOrder
    is_saved?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type ChatSessionMinOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    user_id?: SortOrder
    document_id?: SortOrder
    is_saved?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type EnumMessageRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.MessageRole | EnumMessageRoleFieldRefInput<$PrismaModel>
    in?: $Enums.MessageRole[] | ListEnumMessageRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.MessageRole[] | ListEnumMessageRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumMessageRoleFilter<$PrismaModel> | $Enums.MessageRole
  }
  export type JsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type ChatSessionScalarRelationFilter = {
    is?: ChatSessionWhereInput
    isNot?: ChatSessionWhereInput
  }

  export type ChatMessageCountOrderByAggregateInput = {
    id?: SortOrder
    session_id?: SortOrder
    role?: SortOrder
    content?: SortOrder
    source_nodes?: SortOrder
    tokens_used?: SortOrder
    created_at?: SortOrder
  }

  export type ChatMessageAvgOrderByAggregateInput = {
    tokens_used?: SortOrder
  }

  export type ChatMessageMaxOrderByAggregateInput = {
    id?: SortOrder
    session_id?: SortOrder
    role?: SortOrder
    content?: SortOrder
    tokens_used?: SortOrder
    created_at?: SortOrder
  }

  export type ChatMessageMinOrderByAggregateInput = {
    id?: SortOrder
    session_id?: SortOrder
    role?: SortOrder
    content?: SortOrder
    tokens_used?: SortOrder
    created_at?: SortOrder
  }

  export type ChatMessageSumOrderByAggregateInput = {
    tokens_used?: SortOrder
  }

  export type EnumMessageRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.MessageRole | EnumMessageRoleFieldRefInput<$PrismaModel>
    in?: $Enums.MessageRole[] | ListEnumMessageRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.MessageRole[] | ListEnumMessageRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumMessageRoleWithAggregatesFilter<$PrismaModel> | $Enums.MessageRole
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumMessageRoleFilter<$PrismaModel>
    _max?: NestedEnumMessageRoleFilter<$PrismaModel>
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type EnumSecurityActionFilter<$PrismaModel = never> = {
    equals?: $Enums.SecurityAction | EnumSecurityActionFieldRefInput<$PrismaModel>
    in?: $Enums.SecurityAction[] | ListEnumSecurityActionFieldRefInput<$PrismaModel>
    notIn?: $Enums.SecurityAction[] | ListEnumSecurityActionFieldRefInput<$PrismaModel>
    not?: NestedEnumSecurityActionFilter<$PrismaModel> | $Enums.SecurityAction
  }

  export type SecurityLogCountOrderByAggregateInput = {
    id?: SortOrder
    user_id?: SortOrder
    action?: SortOrder
    details?: SortOrder
    ip_address?: SortOrder
    user_agent?: SortOrder
    created_at?: SortOrder
  }

  export type SecurityLogMaxOrderByAggregateInput = {
    id?: SortOrder
    user_id?: SortOrder
    action?: SortOrder
    details?: SortOrder
    ip_address?: SortOrder
    user_agent?: SortOrder
    created_at?: SortOrder
  }

  export type SecurityLogMinOrderByAggregateInput = {
    id?: SortOrder
    user_id?: SortOrder
    action?: SortOrder
    details?: SortOrder
    ip_address?: SortOrder
    user_agent?: SortOrder
    created_at?: SortOrder
  }

  export type EnumSecurityActionWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SecurityAction | EnumSecurityActionFieldRefInput<$PrismaModel>
    in?: $Enums.SecurityAction[] | ListEnumSecurityActionFieldRefInput<$PrismaModel>
    notIn?: $Enums.SecurityAction[] | ListEnumSecurityActionFieldRefInput<$PrismaModel>
    not?: NestedEnumSecurityActionWithAggregatesFilter<$PrismaModel> | $Enums.SecurityAction
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSecurityActionFilter<$PrismaModel>
    _max?: NestedEnumSecurityActionFilter<$PrismaModel>
  }

  export type EnumTokenTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.TokenType | EnumTokenTypeFieldRefInput<$PrismaModel>
    in?: $Enums.TokenType[] | ListEnumTokenTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.TokenType[] | ListEnumTokenTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumTokenTypeFilter<$PrismaModel> | $Enums.TokenType
  }

  export type UserNullableScalarRelationFilter = {
    is?: UserWhereInput | null
    isNot?: UserWhereInput | null
  }

  export type VerificationTokenCountOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    key?: SortOrder
    token?: SortOrder
    user_id?: SortOrder
    type?: SortOrder
    expires_at?: SortOrder
    used?: SortOrder
    created_at?: SortOrder
  }

  export type VerificationTokenMaxOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    key?: SortOrder
    token?: SortOrder
    user_id?: SortOrder
    type?: SortOrder
    expires_at?: SortOrder
    used?: SortOrder
    created_at?: SortOrder
  }

  export type VerificationTokenMinOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    key?: SortOrder
    token?: SortOrder
    user_id?: SortOrder
    type?: SortOrder
    expires_at?: SortOrder
    used?: SortOrder
    created_at?: SortOrder
  }

  export type EnumTokenTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TokenType | EnumTokenTypeFieldRefInput<$PrismaModel>
    in?: $Enums.TokenType[] | ListEnumTokenTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.TokenType[] | ListEnumTokenTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumTokenTypeWithAggregatesFilter<$PrismaModel> | $Enums.TokenType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTokenTypeFilter<$PrismaModel>
    _max?: NestedEnumTokenTypeFilter<$PrismaModel>
  }

  export type DocumentCreateNestedManyWithoutOwnerInput = {
    create?: XOR<DocumentCreateWithoutOwnerInput, DocumentUncheckedCreateWithoutOwnerInput> | DocumentCreateWithoutOwnerInput[] | DocumentUncheckedCreateWithoutOwnerInput[]
    connectOrCreate?: DocumentCreateOrConnectWithoutOwnerInput | DocumentCreateOrConnectWithoutOwnerInput[]
    createMany?: DocumentCreateManyOwnerInputEnvelope
    connect?: DocumentWhereUniqueInput | DocumentWhereUniqueInput[]
  }

  export type ChatSessionCreateNestedManyWithoutUserInput = {
    create?: XOR<ChatSessionCreateWithoutUserInput, ChatSessionUncheckedCreateWithoutUserInput> | ChatSessionCreateWithoutUserInput[] | ChatSessionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: ChatSessionCreateOrConnectWithoutUserInput | ChatSessionCreateOrConnectWithoutUserInput[]
    createMany?: ChatSessionCreateManyUserInputEnvelope
    connect?: ChatSessionWhereUniqueInput | ChatSessionWhereUniqueInput[]
  }

  export type SecurityLogCreateNestedManyWithoutUserInput = {
    create?: XOR<SecurityLogCreateWithoutUserInput, SecurityLogUncheckedCreateWithoutUserInput> | SecurityLogCreateWithoutUserInput[] | SecurityLogUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SecurityLogCreateOrConnectWithoutUserInput | SecurityLogCreateOrConnectWithoutUserInput[]
    createMany?: SecurityLogCreateManyUserInputEnvelope
    connect?: SecurityLogWhereUniqueInput | SecurityLogWhereUniqueInput[]
  }

  export type VerificationTokenCreateNestedManyWithoutUserInput = {
    create?: XOR<VerificationTokenCreateWithoutUserInput, VerificationTokenUncheckedCreateWithoutUserInput> | VerificationTokenCreateWithoutUserInput[] | VerificationTokenUncheckedCreateWithoutUserInput[]
    connectOrCreate?: VerificationTokenCreateOrConnectWithoutUserInput | VerificationTokenCreateOrConnectWithoutUserInput[]
    createMany?: VerificationTokenCreateManyUserInputEnvelope
    connect?: VerificationTokenWhereUniqueInput | VerificationTokenWhereUniqueInput[]
  }

  export type DocumentUncheckedCreateNestedManyWithoutOwnerInput = {
    create?: XOR<DocumentCreateWithoutOwnerInput, DocumentUncheckedCreateWithoutOwnerInput> | DocumentCreateWithoutOwnerInput[] | DocumentUncheckedCreateWithoutOwnerInput[]
    connectOrCreate?: DocumentCreateOrConnectWithoutOwnerInput | DocumentCreateOrConnectWithoutOwnerInput[]
    createMany?: DocumentCreateManyOwnerInputEnvelope
    connect?: DocumentWhereUniqueInput | DocumentWhereUniqueInput[]
  }

  export type ChatSessionUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<ChatSessionCreateWithoutUserInput, ChatSessionUncheckedCreateWithoutUserInput> | ChatSessionCreateWithoutUserInput[] | ChatSessionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: ChatSessionCreateOrConnectWithoutUserInput | ChatSessionCreateOrConnectWithoutUserInput[]
    createMany?: ChatSessionCreateManyUserInputEnvelope
    connect?: ChatSessionWhereUniqueInput | ChatSessionWhereUniqueInput[]
  }

  export type SecurityLogUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<SecurityLogCreateWithoutUserInput, SecurityLogUncheckedCreateWithoutUserInput> | SecurityLogCreateWithoutUserInput[] | SecurityLogUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SecurityLogCreateOrConnectWithoutUserInput | SecurityLogCreateOrConnectWithoutUserInput[]
    createMany?: SecurityLogCreateManyUserInputEnvelope
    connect?: SecurityLogWhereUniqueInput | SecurityLogWhereUniqueInput[]
  }

  export type VerificationTokenUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<VerificationTokenCreateWithoutUserInput, VerificationTokenUncheckedCreateWithoutUserInput> | VerificationTokenCreateWithoutUserInput[] | VerificationTokenUncheckedCreateWithoutUserInput[]
    connectOrCreate?: VerificationTokenCreateOrConnectWithoutUserInput | VerificationTokenCreateOrConnectWithoutUserInput[]
    createMany?: VerificationTokenCreateManyUserInputEnvelope
    connect?: VerificationTokenWhereUniqueInput | VerificationTokenWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type EnumUserStatusFieldUpdateOperationsInput = {
    set?: $Enums.UserStatus
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type DocumentUpdateManyWithoutOwnerNestedInput = {
    create?: XOR<DocumentCreateWithoutOwnerInput, DocumentUncheckedCreateWithoutOwnerInput> | DocumentCreateWithoutOwnerInput[] | DocumentUncheckedCreateWithoutOwnerInput[]
    connectOrCreate?: DocumentCreateOrConnectWithoutOwnerInput | DocumentCreateOrConnectWithoutOwnerInput[]
    upsert?: DocumentUpsertWithWhereUniqueWithoutOwnerInput | DocumentUpsertWithWhereUniqueWithoutOwnerInput[]
    createMany?: DocumentCreateManyOwnerInputEnvelope
    set?: DocumentWhereUniqueInput | DocumentWhereUniqueInput[]
    disconnect?: DocumentWhereUniqueInput | DocumentWhereUniqueInput[]
    delete?: DocumentWhereUniqueInput | DocumentWhereUniqueInput[]
    connect?: DocumentWhereUniqueInput | DocumentWhereUniqueInput[]
    update?: DocumentUpdateWithWhereUniqueWithoutOwnerInput | DocumentUpdateWithWhereUniqueWithoutOwnerInput[]
    updateMany?: DocumentUpdateManyWithWhereWithoutOwnerInput | DocumentUpdateManyWithWhereWithoutOwnerInput[]
    deleteMany?: DocumentScalarWhereInput | DocumentScalarWhereInput[]
  }

  export type ChatSessionUpdateManyWithoutUserNestedInput = {
    create?: XOR<ChatSessionCreateWithoutUserInput, ChatSessionUncheckedCreateWithoutUserInput> | ChatSessionCreateWithoutUserInput[] | ChatSessionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: ChatSessionCreateOrConnectWithoutUserInput | ChatSessionCreateOrConnectWithoutUserInput[]
    upsert?: ChatSessionUpsertWithWhereUniqueWithoutUserInput | ChatSessionUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: ChatSessionCreateManyUserInputEnvelope
    set?: ChatSessionWhereUniqueInput | ChatSessionWhereUniqueInput[]
    disconnect?: ChatSessionWhereUniqueInput | ChatSessionWhereUniqueInput[]
    delete?: ChatSessionWhereUniqueInput | ChatSessionWhereUniqueInput[]
    connect?: ChatSessionWhereUniqueInput | ChatSessionWhereUniqueInput[]
    update?: ChatSessionUpdateWithWhereUniqueWithoutUserInput | ChatSessionUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: ChatSessionUpdateManyWithWhereWithoutUserInput | ChatSessionUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: ChatSessionScalarWhereInput | ChatSessionScalarWhereInput[]
  }

  export type SecurityLogUpdateManyWithoutUserNestedInput = {
    create?: XOR<SecurityLogCreateWithoutUserInput, SecurityLogUncheckedCreateWithoutUserInput> | SecurityLogCreateWithoutUserInput[] | SecurityLogUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SecurityLogCreateOrConnectWithoutUserInput | SecurityLogCreateOrConnectWithoutUserInput[]
    upsert?: SecurityLogUpsertWithWhereUniqueWithoutUserInput | SecurityLogUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: SecurityLogCreateManyUserInputEnvelope
    set?: SecurityLogWhereUniqueInput | SecurityLogWhereUniqueInput[]
    disconnect?: SecurityLogWhereUniqueInput | SecurityLogWhereUniqueInput[]
    delete?: SecurityLogWhereUniqueInput | SecurityLogWhereUniqueInput[]
    connect?: SecurityLogWhereUniqueInput | SecurityLogWhereUniqueInput[]
    update?: SecurityLogUpdateWithWhereUniqueWithoutUserInput | SecurityLogUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: SecurityLogUpdateManyWithWhereWithoutUserInput | SecurityLogUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: SecurityLogScalarWhereInput | SecurityLogScalarWhereInput[]
  }

  export type VerificationTokenUpdateManyWithoutUserNestedInput = {
    create?: XOR<VerificationTokenCreateWithoutUserInput, VerificationTokenUncheckedCreateWithoutUserInput> | VerificationTokenCreateWithoutUserInput[] | VerificationTokenUncheckedCreateWithoutUserInput[]
    connectOrCreate?: VerificationTokenCreateOrConnectWithoutUserInput | VerificationTokenCreateOrConnectWithoutUserInput[]
    upsert?: VerificationTokenUpsertWithWhereUniqueWithoutUserInput | VerificationTokenUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: VerificationTokenCreateManyUserInputEnvelope
    set?: VerificationTokenWhereUniqueInput | VerificationTokenWhereUniqueInput[]
    disconnect?: VerificationTokenWhereUniqueInput | VerificationTokenWhereUniqueInput[]
    delete?: VerificationTokenWhereUniqueInput | VerificationTokenWhereUniqueInput[]
    connect?: VerificationTokenWhereUniqueInput | VerificationTokenWhereUniqueInput[]
    update?: VerificationTokenUpdateWithWhereUniqueWithoutUserInput | VerificationTokenUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: VerificationTokenUpdateManyWithWhereWithoutUserInput | VerificationTokenUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: VerificationTokenScalarWhereInput | VerificationTokenScalarWhereInput[]
  }

  export type DocumentUncheckedUpdateManyWithoutOwnerNestedInput = {
    create?: XOR<DocumentCreateWithoutOwnerInput, DocumentUncheckedCreateWithoutOwnerInput> | DocumentCreateWithoutOwnerInput[] | DocumentUncheckedCreateWithoutOwnerInput[]
    connectOrCreate?: DocumentCreateOrConnectWithoutOwnerInput | DocumentCreateOrConnectWithoutOwnerInput[]
    upsert?: DocumentUpsertWithWhereUniqueWithoutOwnerInput | DocumentUpsertWithWhereUniqueWithoutOwnerInput[]
    createMany?: DocumentCreateManyOwnerInputEnvelope
    set?: DocumentWhereUniqueInput | DocumentWhereUniqueInput[]
    disconnect?: DocumentWhereUniqueInput | DocumentWhereUniqueInput[]
    delete?: DocumentWhereUniqueInput | DocumentWhereUniqueInput[]
    connect?: DocumentWhereUniqueInput | DocumentWhereUniqueInput[]
    update?: DocumentUpdateWithWhereUniqueWithoutOwnerInput | DocumentUpdateWithWhereUniqueWithoutOwnerInput[]
    updateMany?: DocumentUpdateManyWithWhereWithoutOwnerInput | DocumentUpdateManyWithWhereWithoutOwnerInput[]
    deleteMany?: DocumentScalarWhereInput | DocumentScalarWhereInput[]
  }

  export type ChatSessionUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<ChatSessionCreateWithoutUserInput, ChatSessionUncheckedCreateWithoutUserInput> | ChatSessionCreateWithoutUserInput[] | ChatSessionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: ChatSessionCreateOrConnectWithoutUserInput | ChatSessionCreateOrConnectWithoutUserInput[]
    upsert?: ChatSessionUpsertWithWhereUniqueWithoutUserInput | ChatSessionUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: ChatSessionCreateManyUserInputEnvelope
    set?: ChatSessionWhereUniqueInput | ChatSessionWhereUniqueInput[]
    disconnect?: ChatSessionWhereUniqueInput | ChatSessionWhereUniqueInput[]
    delete?: ChatSessionWhereUniqueInput | ChatSessionWhereUniqueInput[]
    connect?: ChatSessionWhereUniqueInput | ChatSessionWhereUniqueInput[]
    update?: ChatSessionUpdateWithWhereUniqueWithoutUserInput | ChatSessionUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: ChatSessionUpdateManyWithWhereWithoutUserInput | ChatSessionUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: ChatSessionScalarWhereInput | ChatSessionScalarWhereInput[]
  }

  export type SecurityLogUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<SecurityLogCreateWithoutUserInput, SecurityLogUncheckedCreateWithoutUserInput> | SecurityLogCreateWithoutUserInput[] | SecurityLogUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SecurityLogCreateOrConnectWithoutUserInput | SecurityLogCreateOrConnectWithoutUserInput[]
    upsert?: SecurityLogUpsertWithWhereUniqueWithoutUserInput | SecurityLogUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: SecurityLogCreateManyUserInputEnvelope
    set?: SecurityLogWhereUniqueInput | SecurityLogWhereUniqueInput[]
    disconnect?: SecurityLogWhereUniqueInput | SecurityLogWhereUniqueInput[]
    delete?: SecurityLogWhereUniqueInput | SecurityLogWhereUniqueInput[]
    connect?: SecurityLogWhereUniqueInput | SecurityLogWhereUniqueInput[]
    update?: SecurityLogUpdateWithWhereUniqueWithoutUserInput | SecurityLogUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: SecurityLogUpdateManyWithWhereWithoutUserInput | SecurityLogUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: SecurityLogScalarWhereInput | SecurityLogScalarWhereInput[]
  }

  export type VerificationTokenUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<VerificationTokenCreateWithoutUserInput, VerificationTokenUncheckedCreateWithoutUserInput> | VerificationTokenCreateWithoutUserInput[] | VerificationTokenUncheckedCreateWithoutUserInput[]
    connectOrCreate?: VerificationTokenCreateOrConnectWithoutUserInput | VerificationTokenCreateOrConnectWithoutUserInput[]
    upsert?: VerificationTokenUpsertWithWhereUniqueWithoutUserInput | VerificationTokenUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: VerificationTokenCreateManyUserInputEnvelope
    set?: VerificationTokenWhereUniqueInput | VerificationTokenWhereUniqueInput[]
    disconnect?: VerificationTokenWhereUniqueInput | VerificationTokenWhereUniqueInput[]
    delete?: VerificationTokenWhereUniqueInput | VerificationTokenWhereUniqueInput[]
    connect?: VerificationTokenWhereUniqueInput | VerificationTokenWhereUniqueInput[]
    update?: VerificationTokenUpdateWithWhereUniqueWithoutUserInput | VerificationTokenUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: VerificationTokenUpdateManyWithWhereWithoutUserInput | VerificationTokenUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: VerificationTokenScalarWhereInput | VerificationTokenScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutDocumentsInput = {
    create?: XOR<UserCreateWithoutDocumentsInput, UserUncheckedCreateWithoutDocumentsInput>
    connectOrCreate?: UserCreateOrConnectWithoutDocumentsInput
    connect?: UserWhereUniqueInput
  }

  export type ChatSessionCreateNestedManyWithoutDocumentInput = {
    create?: XOR<ChatSessionCreateWithoutDocumentInput, ChatSessionUncheckedCreateWithoutDocumentInput> | ChatSessionCreateWithoutDocumentInput[] | ChatSessionUncheckedCreateWithoutDocumentInput[]
    connectOrCreate?: ChatSessionCreateOrConnectWithoutDocumentInput | ChatSessionCreateOrConnectWithoutDocumentInput[]
    createMany?: ChatSessionCreateManyDocumentInputEnvelope
    connect?: ChatSessionWhereUniqueInput | ChatSessionWhereUniqueInput[]
  }

  export type ChatSessionUncheckedCreateNestedManyWithoutDocumentInput = {
    create?: XOR<ChatSessionCreateWithoutDocumentInput, ChatSessionUncheckedCreateWithoutDocumentInput> | ChatSessionCreateWithoutDocumentInput[] | ChatSessionUncheckedCreateWithoutDocumentInput[]
    connectOrCreate?: ChatSessionCreateOrConnectWithoutDocumentInput | ChatSessionCreateOrConnectWithoutDocumentInput[]
    createMany?: ChatSessionCreateManyDocumentInputEnvelope
    connect?: ChatSessionWhereUniqueInput | ChatSessionWhereUniqueInput[]
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type EnumDocumentStatusFieldUpdateOperationsInput = {
    set?: $Enums.DocumentStatus
  }

  export type NullableBoolFieldUpdateOperationsInput = {
    set?: boolean | null
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type UserUpdateOneRequiredWithoutDocumentsNestedInput = {
    create?: XOR<UserCreateWithoutDocumentsInput, UserUncheckedCreateWithoutDocumentsInput>
    connectOrCreate?: UserCreateOrConnectWithoutDocumentsInput
    upsert?: UserUpsertWithoutDocumentsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutDocumentsInput, UserUpdateWithoutDocumentsInput>, UserUncheckedUpdateWithoutDocumentsInput>
  }

  export type ChatSessionUpdateManyWithoutDocumentNestedInput = {
    create?: XOR<ChatSessionCreateWithoutDocumentInput, ChatSessionUncheckedCreateWithoutDocumentInput> | ChatSessionCreateWithoutDocumentInput[] | ChatSessionUncheckedCreateWithoutDocumentInput[]
    connectOrCreate?: ChatSessionCreateOrConnectWithoutDocumentInput | ChatSessionCreateOrConnectWithoutDocumentInput[]
    upsert?: ChatSessionUpsertWithWhereUniqueWithoutDocumentInput | ChatSessionUpsertWithWhereUniqueWithoutDocumentInput[]
    createMany?: ChatSessionCreateManyDocumentInputEnvelope
    set?: ChatSessionWhereUniqueInput | ChatSessionWhereUniqueInput[]
    disconnect?: ChatSessionWhereUniqueInput | ChatSessionWhereUniqueInput[]
    delete?: ChatSessionWhereUniqueInput | ChatSessionWhereUniqueInput[]
    connect?: ChatSessionWhereUniqueInput | ChatSessionWhereUniqueInput[]
    update?: ChatSessionUpdateWithWhereUniqueWithoutDocumentInput | ChatSessionUpdateWithWhereUniqueWithoutDocumentInput[]
    updateMany?: ChatSessionUpdateManyWithWhereWithoutDocumentInput | ChatSessionUpdateManyWithWhereWithoutDocumentInput[]
    deleteMany?: ChatSessionScalarWhereInput | ChatSessionScalarWhereInput[]
  }

  export type ChatSessionUncheckedUpdateManyWithoutDocumentNestedInput = {
    create?: XOR<ChatSessionCreateWithoutDocumentInput, ChatSessionUncheckedCreateWithoutDocumentInput> | ChatSessionCreateWithoutDocumentInput[] | ChatSessionUncheckedCreateWithoutDocumentInput[]
    connectOrCreate?: ChatSessionCreateOrConnectWithoutDocumentInput | ChatSessionCreateOrConnectWithoutDocumentInput[]
    upsert?: ChatSessionUpsertWithWhereUniqueWithoutDocumentInput | ChatSessionUpsertWithWhereUniqueWithoutDocumentInput[]
    createMany?: ChatSessionCreateManyDocumentInputEnvelope
    set?: ChatSessionWhereUniqueInput | ChatSessionWhereUniqueInput[]
    disconnect?: ChatSessionWhereUniqueInput | ChatSessionWhereUniqueInput[]
    delete?: ChatSessionWhereUniqueInput | ChatSessionWhereUniqueInput[]
    connect?: ChatSessionWhereUniqueInput | ChatSessionWhereUniqueInput[]
    update?: ChatSessionUpdateWithWhereUniqueWithoutDocumentInput | ChatSessionUpdateWithWhereUniqueWithoutDocumentInput[]
    updateMany?: ChatSessionUpdateManyWithWhereWithoutDocumentInput | ChatSessionUpdateManyWithWhereWithoutDocumentInput[]
    deleteMany?: ChatSessionScalarWhereInput | ChatSessionScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutChat_sessionsInput = {
    create?: XOR<UserCreateWithoutChat_sessionsInput, UserUncheckedCreateWithoutChat_sessionsInput>
    connectOrCreate?: UserCreateOrConnectWithoutChat_sessionsInput
    connect?: UserWhereUniqueInput
  }

  export type DocumentCreateNestedOneWithoutChat_sessionsInput = {
    create?: XOR<DocumentCreateWithoutChat_sessionsInput, DocumentUncheckedCreateWithoutChat_sessionsInput>
    connectOrCreate?: DocumentCreateOrConnectWithoutChat_sessionsInput
    connect?: DocumentWhereUniqueInput
  }

  export type ChatMessageCreateNestedManyWithoutSessionInput = {
    create?: XOR<ChatMessageCreateWithoutSessionInput, ChatMessageUncheckedCreateWithoutSessionInput> | ChatMessageCreateWithoutSessionInput[] | ChatMessageUncheckedCreateWithoutSessionInput[]
    connectOrCreate?: ChatMessageCreateOrConnectWithoutSessionInput | ChatMessageCreateOrConnectWithoutSessionInput[]
    createMany?: ChatMessageCreateManySessionInputEnvelope
    connect?: ChatMessageWhereUniqueInput | ChatMessageWhereUniqueInput[]
  }

  export type ChatMessageUncheckedCreateNestedManyWithoutSessionInput = {
    create?: XOR<ChatMessageCreateWithoutSessionInput, ChatMessageUncheckedCreateWithoutSessionInput> | ChatMessageCreateWithoutSessionInput[] | ChatMessageUncheckedCreateWithoutSessionInput[]
    connectOrCreate?: ChatMessageCreateOrConnectWithoutSessionInput | ChatMessageCreateOrConnectWithoutSessionInput[]
    createMany?: ChatMessageCreateManySessionInputEnvelope
    connect?: ChatMessageWhereUniqueInput | ChatMessageWhereUniqueInput[]
  }

  export type UserUpdateOneRequiredWithoutChat_sessionsNestedInput = {
    create?: XOR<UserCreateWithoutChat_sessionsInput, UserUncheckedCreateWithoutChat_sessionsInput>
    connectOrCreate?: UserCreateOrConnectWithoutChat_sessionsInput
    upsert?: UserUpsertWithoutChat_sessionsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutChat_sessionsInput, UserUpdateWithoutChat_sessionsInput>, UserUncheckedUpdateWithoutChat_sessionsInput>
  }

  export type DocumentUpdateOneRequiredWithoutChat_sessionsNestedInput = {
    create?: XOR<DocumentCreateWithoutChat_sessionsInput, DocumentUncheckedCreateWithoutChat_sessionsInput>
    connectOrCreate?: DocumentCreateOrConnectWithoutChat_sessionsInput
    upsert?: DocumentUpsertWithoutChat_sessionsInput
    connect?: DocumentWhereUniqueInput
    update?: XOR<XOR<DocumentUpdateToOneWithWhereWithoutChat_sessionsInput, DocumentUpdateWithoutChat_sessionsInput>, DocumentUncheckedUpdateWithoutChat_sessionsInput>
  }

  export type ChatMessageUpdateManyWithoutSessionNestedInput = {
    create?: XOR<ChatMessageCreateWithoutSessionInput, ChatMessageUncheckedCreateWithoutSessionInput> | ChatMessageCreateWithoutSessionInput[] | ChatMessageUncheckedCreateWithoutSessionInput[]
    connectOrCreate?: ChatMessageCreateOrConnectWithoutSessionInput | ChatMessageCreateOrConnectWithoutSessionInput[]
    upsert?: ChatMessageUpsertWithWhereUniqueWithoutSessionInput | ChatMessageUpsertWithWhereUniqueWithoutSessionInput[]
    createMany?: ChatMessageCreateManySessionInputEnvelope
    set?: ChatMessageWhereUniqueInput | ChatMessageWhereUniqueInput[]
    disconnect?: ChatMessageWhereUniqueInput | ChatMessageWhereUniqueInput[]
    delete?: ChatMessageWhereUniqueInput | ChatMessageWhereUniqueInput[]
    connect?: ChatMessageWhereUniqueInput | ChatMessageWhereUniqueInput[]
    update?: ChatMessageUpdateWithWhereUniqueWithoutSessionInput | ChatMessageUpdateWithWhereUniqueWithoutSessionInput[]
    updateMany?: ChatMessageUpdateManyWithWhereWithoutSessionInput | ChatMessageUpdateManyWithWhereWithoutSessionInput[]
    deleteMany?: ChatMessageScalarWhereInput | ChatMessageScalarWhereInput[]
  }

  export type ChatMessageUncheckedUpdateManyWithoutSessionNestedInput = {
    create?: XOR<ChatMessageCreateWithoutSessionInput, ChatMessageUncheckedCreateWithoutSessionInput> | ChatMessageCreateWithoutSessionInput[] | ChatMessageUncheckedCreateWithoutSessionInput[]
    connectOrCreate?: ChatMessageCreateOrConnectWithoutSessionInput | ChatMessageCreateOrConnectWithoutSessionInput[]
    upsert?: ChatMessageUpsertWithWhereUniqueWithoutSessionInput | ChatMessageUpsertWithWhereUniqueWithoutSessionInput[]
    createMany?: ChatMessageCreateManySessionInputEnvelope
    set?: ChatMessageWhereUniqueInput | ChatMessageWhereUniqueInput[]
    disconnect?: ChatMessageWhereUniqueInput | ChatMessageWhereUniqueInput[]
    delete?: ChatMessageWhereUniqueInput | ChatMessageWhereUniqueInput[]
    connect?: ChatMessageWhereUniqueInput | ChatMessageWhereUniqueInput[]
    update?: ChatMessageUpdateWithWhereUniqueWithoutSessionInput | ChatMessageUpdateWithWhereUniqueWithoutSessionInput[]
    updateMany?: ChatMessageUpdateManyWithWhereWithoutSessionInput | ChatMessageUpdateManyWithWhereWithoutSessionInput[]
    deleteMany?: ChatMessageScalarWhereInput | ChatMessageScalarWhereInput[]
  }

  export type ChatSessionCreateNestedOneWithoutMessagesInput = {
    create?: XOR<ChatSessionCreateWithoutMessagesInput, ChatSessionUncheckedCreateWithoutMessagesInput>
    connectOrCreate?: ChatSessionCreateOrConnectWithoutMessagesInput
    connect?: ChatSessionWhereUniqueInput
  }

  export type EnumMessageRoleFieldUpdateOperationsInput = {
    set?: $Enums.MessageRole
  }

  export type ChatSessionUpdateOneRequiredWithoutMessagesNestedInput = {
    create?: XOR<ChatSessionCreateWithoutMessagesInput, ChatSessionUncheckedCreateWithoutMessagesInput>
    connectOrCreate?: ChatSessionCreateOrConnectWithoutMessagesInput
    upsert?: ChatSessionUpsertWithoutMessagesInput
    connect?: ChatSessionWhereUniqueInput
    update?: XOR<XOR<ChatSessionUpdateToOneWithWhereWithoutMessagesInput, ChatSessionUpdateWithoutMessagesInput>, ChatSessionUncheckedUpdateWithoutMessagesInput>
  }

  export type UserCreateNestedOneWithoutSecurity_logsInput = {
    create?: XOR<UserCreateWithoutSecurity_logsInput, UserUncheckedCreateWithoutSecurity_logsInput>
    connectOrCreate?: UserCreateOrConnectWithoutSecurity_logsInput
    connect?: UserWhereUniqueInput
  }

  export type EnumSecurityActionFieldUpdateOperationsInput = {
    set?: $Enums.SecurityAction
  }

  export type UserUpdateOneRequiredWithoutSecurity_logsNestedInput = {
    create?: XOR<UserCreateWithoutSecurity_logsInput, UserUncheckedCreateWithoutSecurity_logsInput>
    connectOrCreate?: UserCreateOrConnectWithoutSecurity_logsInput
    upsert?: UserUpsertWithoutSecurity_logsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutSecurity_logsInput, UserUpdateWithoutSecurity_logsInput>, UserUncheckedUpdateWithoutSecurity_logsInput>
  }

  export type UserCreateNestedOneWithoutVerification_tokensInput = {
    create?: XOR<UserCreateWithoutVerification_tokensInput, UserUncheckedCreateWithoutVerification_tokensInput>
    connectOrCreate?: UserCreateOrConnectWithoutVerification_tokensInput
    connect?: UserWhereUniqueInput
  }

  export type EnumTokenTypeFieldUpdateOperationsInput = {
    set?: $Enums.TokenType
  }

  export type UserUpdateOneWithoutVerification_tokensNestedInput = {
    create?: XOR<UserCreateWithoutVerification_tokensInput, UserUncheckedCreateWithoutVerification_tokensInput>
    connectOrCreate?: UserCreateOrConnectWithoutVerification_tokensInput
    upsert?: UserUpsertWithoutVerification_tokensInput
    disconnect?: UserWhereInput | boolean
    delete?: UserWhereInput | boolean
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutVerification_tokensInput, UserUpdateWithoutVerification_tokensInput>, UserUncheckedUpdateWithoutVerification_tokensInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedEnumUserStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.UserStatus | EnumUserStatusFieldRefInput<$PrismaModel>
    in?: $Enums.UserStatus[] | ListEnumUserStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.UserStatus[] | ListEnumUserStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumUserStatusFilter<$PrismaModel> | $Enums.UserStatus
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedEnumUserStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.UserStatus | EnumUserStatusFieldRefInput<$PrismaModel>
    in?: $Enums.UserStatus[] | ListEnumUserStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.UserStatus[] | ListEnumUserStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumUserStatusWithAggregatesFilter<$PrismaModel> | $Enums.UserStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumUserStatusFilter<$PrismaModel>
    _max?: NestedEnumUserStatusFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedEnumDocumentStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.DocumentStatus | EnumDocumentStatusFieldRefInput<$PrismaModel>
    in?: $Enums.DocumentStatus[] | ListEnumDocumentStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.DocumentStatus[] | ListEnumDocumentStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumDocumentStatusFilter<$PrismaModel> | $Enums.DocumentStatus
  }

  export type NestedBoolNullableFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableFilter<$PrismaModel> | boolean | null
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedEnumDocumentStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.DocumentStatus | EnumDocumentStatusFieldRefInput<$PrismaModel>
    in?: $Enums.DocumentStatus[] | ListEnumDocumentStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.DocumentStatus[] | ListEnumDocumentStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumDocumentStatusWithAggregatesFilter<$PrismaModel> | $Enums.DocumentStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumDocumentStatusFilter<$PrismaModel>
    _max?: NestedEnumDocumentStatusFilter<$PrismaModel>
  }

  export type NestedBoolNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableWithAggregatesFilter<$PrismaModel> | boolean | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedBoolNullableFilter<$PrismaModel>
    _max?: NestedBoolNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumMessageRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.MessageRole | EnumMessageRoleFieldRefInput<$PrismaModel>
    in?: $Enums.MessageRole[] | ListEnumMessageRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.MessageRole[] | ListEnumMessageRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumMessageRoleFilter<$PrismaModel> | $Enums.MessageRole
  }

  export type NestedEnumMessageRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.MessageRole | EnumMessageRoleFieldRefInput<$PrismaModel>
    in?: $Enums.MessageRole[] | ListEnumMessageRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.MessageRole[] | ListEnumMessageRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumMessageRoleWithAggregatesFilter<$PrismaModel> | $Enums.MessageRole
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumMessageRoleFilter<$PrismaModel>
    _max?: NestedEnumMessageRoleFilter<$PrismaModel>
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedEnumSecurityActionFilter<$PrismaModel = never> = {
    equals?: $Enums.SecurityAction | EnumSecurityActionFieldRefInput<$PrismaModel>
    in?: $Enums.SecurityAction[] | ListEnumSecurityActionFieldRefInput<$PrismaModel>
    notIn?: $Enums.SecurityAction[] | ListEnumSecurityActionFieldRefInput<$PrismaModel>
    not?: NestedEnumSecurityActionFilter<$PrismaModel> | $Enums.SecurityAction
  }

  export type NestedEnumSecurityActionWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SecurityAction | EnumSecurityActionFieldRefInput<$PrismaModel>
    in?: $Enums.SecurityAction[] | ListEnumSecurityActionFieldRefInput<$PrismaModel>
    notIn?: $Enums.SecurityAction[] | ListEnumSecurityActionFieldRefInput<$PrismaModel>
    not?: NestedEnumSecurityActionWithAggregatesFilter<$PrismaModel> | $Enums.SecurityAction
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSecurityActionFilter<$PrismaModel>
    _max?: NestedEnumSecurityActionFilter<$PrismaModel>
  }

  export type NestedEnumTokenTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.TokenType | EnumTokenTypeFieldRefInput<$PrismaModel>
    in?: $Enums.TokenType[] | ListEnumTokenTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.TokenType[] | ListEnumTokenTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumTokenTypeFilter<$PrismaModel> | $Enums.TokenType
  }

  export type NestedEnumTokenTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TokenType | EnumTokenTypeFieldRefInput<$PrismaModel>
    in?: $Enums.TokenType[] | ListEnumTokenTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.TokenType[] | ListEnumTokenTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumTokenTypeWithAggregatesFilter<$PrismaModel> | $Enums.TokenType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTokenTypeFilter<$PrismaModel>
    _max?: NestedEnumTokenTypeFilter<$PrismaModel>
  }

  export type DocumentCreateWithoutOwnerInput = {
    id?: string
    file_name: string
    original_file_name: string
    file_path: string
    file_size: number
    mime_type: string
    status?: $Enums.DocumentStatus
    is_scanned?: boolean | null
    page_count?: number | null
    uploaded_at?: Date | string
    updated_at?: Date | string
    chat_sessions?: ChatSessionCreateNestedManyWithoutDocumentInput
  }

  export type DocumentUncheckedCreateWithoutOwnerInput = {
    id?: string
    file_name: string
    original_file_name: string
    file_path: string
    file_size: number
    mime_type: string
    status?: $Enums.DocumentStatus
    is_scanned?: boolean | null
    page_count?: number | null
    uploaded_at?: Date | string
    updated_at?: Date | string
    chat_sessions?: ChatSessionUncheckedCreateNestedManyWithoutDocumentInput
  }

  export type DocumentCreateOrConnectWithoutOwnerInput = {
    where: DocumentWhereUniqueInput
    create: XOR<DocumentCreateWithoutOwnerInput, DocumentUncheckedCreateWithoutOwnerInput>
  }

  export type DocumentCreateManyOwnerInputEnvelope = {
    data: DocumentCreateManyOwnerInput | DocumentCreateManyOwnerInput[]
    skipDuplicates?: boolean
  }

  export type ChatSessionCreateWithoutUserInput = {
    id?: string
    title?: string | null
    is_saved?: boolean
    created_at?: Date | string
    updated_at?: Date | string
    document: DocumentCreateNestedOneWithoutChat_sessionsInput
    messages?: ChatMessageCreateNestedManyWithoutSessionInput
  }

  export type ChatSessionUncheckedCreateWithoutUserInput = {
    id?: string
    title?: string | null
    document_id: string
    is_saved?: boolean
    created_at?: Date | string
    updated_at?: Date | string
    messages?: ChatMessageUncheckedCreateNestedManyWithoutSessionInput
  }

  export type ChatSessionCreateOrConnectWithoutUserInput = {
    where: ChatSessionWhereUniqueInput
    create: XOR<ChatSessionCreateWithoutUserInput, ChatSessionUncheckedCreateWithoutUserInput>
  }

  export type ChatSessionCreateManyUserInputEnvelope = {
    data: ChatSessionCreateManyUserInput | ChatSessionCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type SecurityLogCreateWithoutUserInput = {
    id?: string
    action: $Enums.SecurityAction
    details?: string | null
    ip_address?: string | null
    user_agent?: string | null
    created_at?: Date | string
  }

  export type SecurityLogUncheckedCreateWithoutUserInput = {
    id?: string
    action: $Enums.SecurityAction
    details?: string | null
    ip_address?: string | null
    user_agent?: string | null
    created_at?: Date | string
  }

  export type SecurityLogCreateOrConnectWithoutUserInput = {
    where: SecurityLogWhereUniqueInput
    create: XOR<SecurityLogCreateWithoutUserInput, SecurityLogUncheckedCreateWithoutUserInput>
  }

  export type SecurityLogCreateManyUserInputEnvelope = {
    data: SecurityLogCreateManyUserInput | SecurityLogCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type VerificationTokenCreateWithoutUserInput = {
    id?: string
    email: string
    key: string
    token: string
    type?: $Enums.TokenType
    expires_at: Date | string
    used?: boolean
    created_at?: Date | string
  }

  export type VerificationTokenUncheckedCreateWithoutUserInput = {
    id?: string
    email: string
    key: string
    token: string
    type?: $Enums.TokenType
    expires_at: Date | string
    used?: boolean
    created_at?: Date | string
  }

  export type VerificationTokenCreateOrConnectWithoutUserInput = {
    where: VerificationTokenWhereUniqueInput
    create: XOR<VerificationTokenCreateWithoutUserInput, VerificationTokenUncheckedCreateWithoutUserInput>
  }

  export type VerificationTokenCreateManyUserInputEnvelope = {
    data: VerificationTokenCreateManyUserInput | VerificationTokenCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type DocumentUpsertWithWhereUniqueWithoutOwnerInput = {
    where: DocumentWhereUniqueInput
    update: XOR<DocumentUpdateWithoutOwnerInput, DocumentUncheckedUpdateWithoutOwnerInput>
    create: XOR<DocumentCreateWithoutOwnerInput, DocumentUncheckedCreateWithoutOwnerInput>
  }

  export type DocumentUpdateWithWhereUniqueWithoutOwnerInput = {
    where: DocumentWhereUniqueInput
    data: XOR<DocumentUpdateWithoutOwnerInput, DocumentUncheckedUpdateWithoutOwnerInput>
  }

  export type DocumentUpdateManyWithWhereWithoutOwnerInput = {
    where: DocumentScalarWhereInput
    data: XOR<DocumentUpdateManyMutationInput, DocumentUncheckedUpdateManyWithoutOwnerInput>
  }

  export type DocumentScalarWhereInput = {
    AND?: DocumentScalarWhereInput | DocumentScalarWhereInput[]
    OR?: DocumentScalarWhereInput[]
    NOT?: DocumentScalarWhereInput | DocumentScalarWhereInput[]
    id?: StringFilter<"Document"> | string
    file_name?: StringFilter<"Document"> | string
    original_file_name?: StringFilter<"Document"> | string
    file_path?: StringFilter<"Document"> | string
    file_size?: IntFilter<"Document"> | number
    mime_type?: StringFilter<"Document"> | string
    status?: EnumDocumentStatusFilter<"Document"> | $Enums.DocumentStatus
    is_scanned?: BoolNullableFilter<"Document"> | boolean | null
    page_count?: IntNullableFilter<"Document"> | number | null
    owner_id?: StringFilter<"Document"> | string
    uploaded_at?: DateTimeFilter<"Document"> | Date | string
    updated_at?: DateTimeFilter<"Document"> | Date | string
  }

  export type ChatSessionUpsertWithWhereUniqueWithoutUserInput = {
    where: ChatSessionWhereUniqueInput
    update: XOR<ChatSessionUpdateWithoutUserInput, ChatSessionUncheckedUpdateWithoutUserInput>
    create: XOR<ChatSessionCreateWithoutUserInput, ChatSessionUncheckedCreateWithoutUserInput>
  }

  export type ChatSessionUpdateWithWhereUniqueWithoutUserInput = {
    where: ChatSessionWhereUniqueInput
    data: XOR<ChatSessionUpdateWithoutUserInput, ChatSessionUncheckedUpdateWithoutUserInput>
  }

  export type ChatSessionUpdateManyWithWhereWithoutUserInput = {
    where: ChatSessionScalarWhereInput
    data: XOR<ChatSessionUpdateManyMutationInput, ChatSessionUncheckedUpdateManyWithoutUserInput>
  }

  export type ChatSessionScalarWhereInput = {
    AND?: ChatSessionScalarWhereInput | ChatSessionScalarWhereInput[]
    OR?: ChatSessionScalarWhereInput[]
    NOT?: ChatSessionScalarWhereInput | ChatSessionScalarWhereInput[]
    id?: StringFilter<"ChatSession"> | string
    title?: StringNullableFilter<"ChatSession"> | string | null
    user_id?: StringFilter<"ChatSession"> | string
    document_id?: StringFilter<"ChatSession"> | string
    is_saved?: BoolFilter<"ChatSession"> | boolean
    created_at?: DateTimeFilter<"ChatSession"> | Date | string
    updated_at?: DateTimeFilter<"ChatSession"> | Date | string
  }

  export type SecurityLogUpsertWithWhereUniqueWithoutUserInput = {
    where: SecurityLogWhereUniqueInput
    update: XOR<SecurityLogUpdateWithoutUserInput, SecurityLogUncheckedUpdateWithoutUserInput>
    create: XOR<SecurityLogCreateWithoutUserInput, SecurityLogUncheckedCreateWithoutUserInput>
  }

  export type SecurityLogUpdateWithWhereUniqueWithoutUserInput = {
    where: SecurityLogWhereUniqueInput
    data: XOR<SecurityLogUpdateWithoutUserInput, SecurityLogUncheckedUpdateWithoutUserInput>
  }

  export type SecurityLogUpdateManyWithWhereWithoutUserInput = {
    where: SecurityLogScalarWhereInput
    data: XOR<SecurityLogUpdateManyMutationInput, SecurityLogUncheckedUpdateManyWithoutUserInput>
  }

  export type SecurityLogScalarWhereInput = {
    AND?: SecurityLogScalarWhereInput | SecurityLogScalarWhereInput[]
    OR?: SecurityLogScalarWhereInput[]
    NOT?: SecurityLogScalarWhereInput | SecurityLogScalarWhereInput[]
    id?: StringFilter<"SecurityLog"> | string
    user_id?: StringFilter<"SecurityLog"> | string
    action?: EnumSecurityActionFilter<"SecurityLog"> | $Enums.SecurityAction
    details?: StringNullableFilter<"SecurityLog"> | string | null
    ip_address?: StringNullableFilter<"SecurityLog"> | string | null
    user_agent?: StringNullableFilter<"SecurityLog"> | string | null
    created_at?: DateTimeFilter<"SecurityLog"> | Date | string
  }

  export type VerificationTokenUpsertWithWhereUniqueWithoutUserInput = {
    where: VerificationTokenWhereUniqueInput
    update: XOR<VerificationTokenUpdateWithoutUserInput, VerificationTokenUncheckedUpdateWithoutUserInput>
    create: XOR<VerificationTokenCreateWithoutUserInput, VerificationTokenUncheckedCreateWithoutUserInput>
  }

  export type VerificationTokenUpdateWithWhereUniqueWithoutUserInput = {
    where: VerificationTokenWhereUniqueInput
    data: XOR<VerificationTokenUpdateWithoutUserInput, VerificationTokenUncheckedUpdateWithoutUserInput>
  }

  export type VerificationTokenUpdateManyWithWhereWithoutUserInput = {
    where: VerificationTokenScalarWhereInput
    data: XOR<VerificationTokenUpdateManyMutationInput, VerificationTokenUncheckedUpdateManyWithoutUserInput>
  }

  export type VerificationTokenScalarWhereInput = {
    AND?: VerificationTokenScalarWhereInput | VerificationTokenScalarWhereInput[]
    OR?: VerificationTokenScalarWhereInput[]
    NOT?: VerificationTokenScalarWhereInput | VerificationTokenScalarWhereInput[]
    id?: StringFilter<"VerificationToken"> | string
    email?: StringFilter<"VerificationToken"> | string
    key?: StringFilter<"VerificationToken"> | string
    token?: StringFilter<"VerificationToken"> | string
    user_id?: StringNullableFilter<"VerificationToken"> | string | null
    type?: EnumTokenTypeFilter<"VerificationToken"> | $Enums.TokenType
    expires_at?: DateTimeFilter<"VerificationToken"> | Date | string
    used?: BoolFilter<"VerificationToken"> | boolean
    created_at?: DateTimeFilter<"VerificationToken"> | Date | string
  }

  export type UserCreateWithoutDocumentsInput = {
    id?: string
    name?: string | null
    email: string
    password: string
    job_title?: string | null
    profile_picture?: string | null
    is_paid_user?: boolean
    two_factor_enabled?: boolean
    two_factor_secret?: string | null
    ai_personality?: string | null
    status?: $Enums.UserStatus
    email_verified?: boolean
    created_at?: Date | string
    updated_at?: Date | string
    last_login_at?: Date | string | null
    chat_sessions?: ChatSessionCreateNestedManyWithoutUserInput
    security_logs?: SecurityLogCreateNestedManyWithoutUserInput
    verification_tokens?: VerificationTokenCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutDocumentsInput = {
    id?: string
    name?: string | null
    email: string
    password: string
    job_title?: string | null
    profile_picture?: string | null
    is_paid_user?: boolean
    two_factor_enabled?: boolean
    two_factor_secret?: string | null
    ai_personality?: string | null
    status?: $Enums.UserStatus
    email_verified?: boolean
    created_at?: Date | string
    updated_at?: Date | string
    last_login_at?: Date | string | null
    chat_sessions?: ChatSessionUncheckedCreateNestedManyWithoutUserInput
    security_logs?: SecurityLogUncheckedCreateNestedManyWithoutUserInput
    verification_tokens?: VerificationTokenUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutDocumentsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutDocumentsInput, UserUncheckedCreateWithoutDocumentsInput>
  }

  export type ChatSessionCreateWithoutDocumentInput = {
    id?: string
    title?: string | null
    is_saved?: boolean
    created_at?: Date | string
    updated_at?: Date | string
    user: UserCreateNestedOneWithoutChat_sessionsInput
    messages?: ChatMessageCreateNestedManyWithoutSessionInput
  }

  export type ChatSessionUncheckedCreateWithoutDocumentInput = {
    id?: string
    title?: string | null
    user_id: string
    is_saved?: boolean
    created_at?: Date | string
    updated_at?: Date | string
    messages?: ChatMessageUncheckedCreateNestedManyWithoutSessionInput
  }

  export type ChatSessionCreateOrConnectWithoutDocumentInput = {
    where: ChatSessionWhereUniqueInput
    create: XOR<ChatSessionCreateWithoutDocumentInput, ChatSessionUncheckedCreateWithoutDocumentInput>
  }

  export type ChatSessionCreateManyDocumentInputEnvelope = {
    data: ChatSessionCreateManyDocumentInput | ChatSessionCreateManyDocumentInput[]
    skipDuplicates?: boolean
  }

  export type UserUpsertWithoutDocumentsInput = {
    update: XOR<UserUpdateWithoutDocumentsInput, UserUncheckedUpdateWithoutDocumentsInput>
    create: XOR<UserCreateWithoutDocumentsInput, UserUncheckedCreateWithoutDocumentsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutDocumentsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutDocumentsInput, UserUncheckedUpdateWithoutDocumentsInput>
  }

  export type UserUpdateWithoutDocumentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    job_title?: NullableStringFieldUpdateOperationsInput | string | null
    profile_picture?: NullableStringFieldUpdateOperationsInput | string | null
    is_paid_user?: BoolFieldUpdateOperationsInput | boolean
    two_factor_enabled?: BoolFieldUpdateOperationsInput | boolean
    two_factor_secret?: NullableStringFieldUpdateOperationsInput | string | null
    ai_personality?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumUserStatusFieldUpdateOperationsInput | $Enums.UserStatus
    email_verified?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    last_login_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    chat_sessions?: ChatSessionUpdateManyWithoutUserNestedInput
    security_logs?: SecurityLogUpdateManyWithoutUserNestedInput
    verification_tokens?: VerificationTokenUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutDocumentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    job_title?: NullableStringFieldUpdateOperationsInput | string | null
    profile_picture?: NullableStringFieldUpdateOperationsInput | string | null
    is_paid_user?: BoolFieldUpdateOperationsInput | boolean
    two_factor_enabled?: BoolFieldUpdateOperationsInput | boolean
    two_factor_secret?: NullableStringFieldUpdateOperationsInput | string | null
    ai_personality?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumUserStatusFieldUpdateOperationsInput | $Enums.UserStatus
    email_verified?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    last_login_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    chat_sessions?: ChatSessionUncheckedUpdateManyWithoutUserNestedInput
    security_logs?: SecurityLogUncheckedUpdateManyWithoutUserNestedInput
    verification_tokens?: VerificationTokenUncheckedUpdateManyWithoutUserNestedInput
  }

  export type ChatSessionUpsertWithWhereUniqueWithoutDocumentInput = {
    where: ChatSessionWhereUniqueInput
    update: XOR<ChatSessionUpdateWithoutDocumentInput, ChatSessionUncheckedUpdateWithoutDocumentInput>
    create: XOR<ChatSessionCreateWithoutDocumentInput, ChatSessionUncheckedCreateWithoutDocumentInput>
  }

  export type ChatSessionUpdateWithWhereUniqueWithoutDocumentInput = {
    where: ChatSessionWhereUniqueInput
    data: XOR<ChatSessionUpdateWithoutDocumentInput, ChatSessionUncheckedUpdateWithoutDocumentInput>
  }

  export type ChatSessionUpdateManyWithWhereWithoutDocumentInput = {
    where: ChatSessionScalarWhereInput
    data: XOR<ChatSessionUpdateManyMutationInput, ChatSessionUncheckedUpdateManyWithoutDocumentInput>
  }

  export type UserCreateWithoutChat_sessionsInput = {
    id?: string
    name?: string | null
    email: string
    password: string
    job_title?: string | null
    profile_picture?: string | null
    is_paid_user?: boolean
    two_factor_enabled?: boolean
    two_factor_secret?: string | null
    ai_personality?: string | null
    status?: $Enums.UserStatus
    email_verified?: boolean
    created_at?: Date | string
    updated_at?: Date | string
    last_login_at?: Date | string | null
    documents?: DocumentCreateNestedManyWithoutOwnerInput
    security_logs?: SecurityLogCreateNestedManyWithoutUserInput
    verification_tokens?: VerificationTokenCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutChat_sessionsInput = {
    id?: string
    name?: string | null
    email: string
    password: string
    job_title?: string | null
    profile_picture?: string | null
    is_paid_user?: boolean
    two_factor_enabled?: boolean
    two_factor_secret?: string | null
    ai_personality?: string | null
    status?: $Enums.UserStatus
    email_verified?: boolean
    created_at?: Date | string
    updated_at?: Date | string
    last_login_at?: Date | string | null
    documents?: DocumentUncheckedCreateNestedManyWithoutOwnerInput
    security_logs?: SecurityLogUncheckedCreateNestedManyWithoutUserInput
    verification_tokens?: VerificationTokenUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutChat_sessionsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutChat_sessionsInput, UserUncheckedCreateWithoutChat_sessionsInput>
  }

  export type DocumentCreateWithoutChat_sessionsInput = {
    id?: string
    file_name: string
    original_file_name: string
    file_path: string
    file_size: number
    mime_type: string
    status?: $Enums.DocumentStatus
    is_scanned?: boolean | null
    page_count?: number | null
    uploaded_at?: Date | string
    updated_at?: Date | string
    owner: UserCreateNestedOneWithoutDocumentsInput
  }

  export type DocumentUncheckedCreateWithoutChat_sessionsInput = {
    id?: string
    file_name: string
    original_file_name: string
    file_path: string
    file_size: number
    mime_type: string
    status?: $Enums.DocumentStatus
    is_scanned?: boolean | null
    page_count?: number | null
    owner_id: string
    uploaded_at?: Date | string
    updated_at?: Date | string
  }

  export type DocumentCreateOrConnectWithoutChat_sessionsInput = {
    where: DocumentWhereUniqueInput
    create: XOR<DocumentCreateWithoutChat_sessionsInput, DocumentUncheckedCreateWithoutChat_sessionsInput>
  }

  export type ChatMessageCreateWithoutSessionInput = {
    id?: string
    role: $Enums.MessageRole
    content: string
    source_nodes?: NullableJsonNullValueInput | InputJsonValue
    tokens_used?: number | null
    created_at?: Date | string
  }

  export type ChatMessageUncheckedCreateWithoutSessionInput = {
    id?: string
    role: $Enums.MessageRole
    content: string
    source_nodes?: NullableJsonNullValueInput | InputJsonValue
    tokens_used?: number | null
    created_at?: Date | string
  }

  export type ChatMessageCreateOrConnectWithoutSessionInput = {
    where: ChatMessageWhereUniqueInput
    create: XOR<ChatMessageCreateWithoutSessionInput, ChatMessageUncheckedCreateWithoutSessionInput>
  }

  export type ChatMessageCreateManySessionInputEnvelope = {
    data: ChatMessageCreateManySessionInput | ChatMessageCreateManySessionInput[]
    skipDuplicates?: boolean
  }

  export type UserUpsertWithoutChat_sessionsInput = {
    update: XOR<UserUpdateWithoutChat_sessionsInput, UserUncheckedUpdateWithoutChat_sessionsInput>
    create: XOR<UserCreateWithoutChat_sessionsInput, UserUncheckedCreateWithoutChat_sessionsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutChat_sessionsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutChat_sessionsInput, UserUncheckedUpdateWithoutChat_sessionsInput>
  }

  export type UserUpdateWithoutChat_sessionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    job_title?: NullableStringFieldUpdateOperationsInput | string | null
    profile_picture?: NullableStringFieldUpdateOperationsInput | string | null
    is_paid_user?: BoolFieldUpdateOperationsInput | boolean
    two_factor_enabled?: BoolFieldUpdateOperationsInput | boolean
    two_factor_secret?: NullableStringFieldUpdateOperationsInput | string | null
    ai_personality?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumUserStatusFieldUpdateOperationsInput | $Enums.UserStatus
    email_verified?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    last_login_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    documents?: DocumentUpdateManyWithoutOwnerNestedInput
    security_logs?: SecurityLogUpdateManyWithoutUserNestedInput
    verification_tokens?: VerificationTokenUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutChat_sessionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    job_title?: NullableStringFieldUpdateOperationsInput | string | null
    profile_picture?: NullableStringFieldUpdateOperationsInput | string | null
    is_paid_user?: BoolFieldUpdateOperationsInput | boolean
    two_factor_enabled?: BoolFieldUpdateOperationsInput | boolean
    two_factor_secret?: NullableStringFieldUpdateOperationsInput | string | null
    ai_personality?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumUserStatusFieldUpdateOperationsInput | $Enums.UserStatus
    email_verified?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    last_login_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    documents?: DocumentUncheckedUpdateManyWithoutOwnerNestedInput
    security_logs?: SecurityLogUncheckedUpdateManyWithoutUserNestedInput
    verification_tokens?: VerificationTokenUncheckedUpdateManyWithoutUserNestedInput
  }

  export type DocumentUpsertWithoutChat_sessionsInput = {
    update: XOR<DocumentUpdateWithoutChat_sessionsInput, DocumentUncheckedUpdateWithoutChat_sessionsInput>
    create: XOR<DocumentCreateWithoutChat_sessionsInput, DocumentUncheckedCreateWithoutChat_sessionsInput>
    where?: DocumentWhereInput
  }

  export type DocumentUpdateToOneWithWhereWithoutChat_sessionsInput = {
    where?: DocumentWhereInput
    data: XOR<DocumentUpdateWithoutChat_sessionsInput, DocumentUncheckedUpdateWithoutChat_sessionsInput>
  }

  export type DocumentUpdateWithoutChat_sessionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    file_name?: StringFieldUpdateOperationsInput | string
    original_file_name?: StringFieldUpdateOperationsInput | string
    file_path?: StringFieldUpdateOperationsInput | string
    file_size?: IntFieldUpdateOperationsInput | number
    mime_type?: StringFieldUpdateOperationsInput | string
    status?: EnumDocumentStatusFieldUpdateOperationsInput | $Enums.DocumentStatus
    is_scanned?: NullableBoolFieldUpdateOperationsInput | boolean | null
    page_count?: NullableIntFieldUpdateOperationsInput | number | null
    uploaded_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    owner?: UserUpdateOneRequiredWithoutDocumentsNestedInput
  }

  export type DocumentUncheckedUpdateWithoutChat_sessionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    file_name?: StringFieldUpdateOperationsInput | string
    original_file_name?: StringFieldUpdateOperationsInput | string
    file_path?: StringFieldUpdateOperationsInput | string
    file_size?: IntFieldUpdateOperationsInput | number
    mime_type?: StringFieldUpdateOperationsInput | string
    status?: EnumDocumentStatusFieldUpdateOperationsInput | $Enums.DocumentStatus
    is_scanned?: NullableBoolFieldUpdateOperationsInput | boolean | null
    page_count?: NullableIntFieldUpdateOperationsInput | number | null
    owner_id?: StringFieldUpdateOperationsInput | string
    uploaded_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChatMessageUpsertWithWhereUniqueWithoutSessionInput = {
    where: ChatMessageWhereUniqueInput
    update: XOR<ChatMessageUpdateWithoutSessionInput, ChatMessageUncheckedUpdateWithoutSessionInput>
    create: XOR<ChatMessageCreateWithoutSessionInput, ChatMessageUncheckedCreateWithoutSessionInput>
  }

  export type ChatMessageUpdateWithWhereUniqueWithoutSessionInput = {
    where: ChatMessageWhereUniqueInput
    data: XOR<ChatMessageUpdateWithoutSessionInput, ChatMessageUncheckedUpdateWithoutSessionInput>
  }

  export type ChatMessageUpdateManyWithWhereWithoutSessionInput = {
    where: ChatMessageScalarWhereInput
    data: XOR<ChatMessageUpdateManyMutationInput, ChatMessageUncheckedUpdateManyWithoutSessionInput>
  }

  export type ChatMessageScalarWhereInput = {
    AND?: ChatMessageScalarWhereInput | ChatMessageScalarWhereInput[]
    OR?: ChatMessageScalarWhereInput[]
    NOT?: ChatMessageScalarWhereInput | ChatMessageScalarWhereInput[]
    id?: StringFilter<"ChatMessage"> | string
    session_id?: StringFilter<"ChatMessage"> | string
    role?: EnumMessageRoleFilter<"ChatMessage"> | $Enums.MessageRole
    content?: StringFilter<"ChatMessage"> | string
    source_nodes?: JsonNullableFilter<"ChatMessage">
    tokens_used?: IntNullableFilter<"ChatMessage"> | number | null
    created_at?: DateTimeFilter<"ChatMessage"> | Date | string
  }

  export type ChatSessionCreateWithoutMessagesInput = {
    id?: string
    title?: string | null
    is_saved?: boolean
    created_at?: Date | string
    updated_at?: Date | string
    user: UserCreateNestedOneWithoutChat_sessionsInput
    document: DocumentCreateNestedOneWithoutChat_sessionsInput
  }

  export type ChatSessionUncheckedCreateWithoutMessagesInput = {
    id?: string
    title?: string | null
    user_id: string
    document_id: string
    is_saved?: boolean
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type ChatSessionCreateOrConnectWithoutMessagesInput = {
    where: ChatSessionWhereUniqueInput
    create: XOR<ChatSessionCreateWithoutMessagesInput, ChatSessionUncheckedCreateWithoutMessagesInput>
  }

  export type ChatSessionUpsertWithoutMessagesInput = {
    update: XOR<ChatSessionUpdateWithoutMessagesInput, ChatSessionUncheckedUpdateWithoutMessagesInput>
    create: XOR<ChatSessionCreateWithoutMessagesInput, ChatSessionUncheckedCreateWithoutMessagesInput>
    where?: ChatSessionWhereInput
  }

  export type ChatSessionUpdateToOneWithWhereWithoutMessagesInput = {
    where?: ChatSessionWhereInput
    data: XOR<ChatSessionUpdateWithoutMessagesInput, ChatSessionUncheckedUpdateWithoutMessagesInput>
  }

  export type ChatSessionUpdateWithoutMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    is_saved?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutChat_sessionsNestedInput
    document?: DocumentUpdateOneRequiredWithoutChat_sessionsNestedInput
  }

  export type ChatSessionUncheckedUpdateWithoutMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    user_id?: StringFieldUpdateOperationsInput | string
    document_id?: StringFieldUpdateOperationsInput | string
    is_saved?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserCreateWithoutSecurity_logsInput = {
    id?: string
    name?: string | null
    email: string
    password: string
    job_title?: string | null
    profile_picture?: string | null
    is_paid_user?: boolean
    two_factor_enabled?: boolean
    two_factor_secret?: string | null
    ai_personality?: string | null
    status?: $Enums.UserStatus
    email_verified?: boolean
    created_at?: Date | string
    updated_at?: Date | string
    last_login_at?: Date | string | null
    documents?: DocumentCreateNestedManyWithoutOwnerInput
    chat_sessions?: ChatSessionCreateNestedManyWithoutUserInput
    verification_tokens?: VerificationTokenCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutSecurity_logsInput = {
    id?: string
    name?: string | null
    email: string
    password: string
    job_title?: string | null
    profile_picture?: string | null
    is_paid_user?: boolean
    two_factor_enabled?: boolean
    two_factor_secret?: string | null
    ai_personality?: string | null
    status?: $Enums.UserStatus
    email_verified?: boolean
    created_at?: Date | string
    updated_at?: Date | string
    last_login_at?: Date | string | null
    documents?: DocumentUncheckedCreateNestedManyWithoutOwnerInput
    chat_sessions?: ChatSessionUncheckedCreateNestedManyWithoutUserInput
    verification_tokens?: VerificationTokenUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutSecurity_logsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutSecurity_logsInput, UserUncheckedCreateWithoutSecurity_logsInput>
  }

  export type UserUpsertWithoutSecurity_logsInput = {
    update: XOR<UserUpdateWithoutSecurity_logsInput, UserUncheckedUpdateWithoutSecurity_logsInput>
    create: XOR<UserCreateWithoutSecurity_logsInput, UserUncheckedCreateWithoutSecurity_logsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutSecurity_logsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutSecurity_logsInput, UserUncheckedUpdateWithoutSecurity_logsInput>
  }

  export type UserUpdateWithoutSecurity_logsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    job_title?: NullableStringFieldUpdateOperationsInput | string | null
    profile_picture?: NullableStringFieldUpdateOperationsInput | string | null
    is_paid_user?: BoolFieldUpdateOperationsInput | boolean
    two_factor_enabled?: BoolFieldUpdateOperationsInput | boolean
    two_factor_secret?: NullableStringFieldUpdateOperationsInput | string | null
    ai_personality?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumUserStatusFieldUpdateOperationsInput | $Enums.UserStatus
    email_verified?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    last_login_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    documents?: DocumentUpdateManyWithoutOwnerNestedInput
    chat_sessions?: ChatSessionUpdateManyWithoutUserNestedInput
    verification_tokens?: VerificationTokenUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutSecurity_logsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    job_title?: NullableStringFieldUpdateOperationsInput | string | null
    profile_picture?: NullableStringFieldUpdateOperationsInput | string | null
    is_paid_user?: BoolFieldUpdateOperationsInput | boolean
    two_factor_enabled?: BoolFieldUpdateOperationsInput | boolean
    two_factor_secret?: NullableStringFieldUpdateOperationsInput | string | null
    ai_personality?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumUserStatusFieldUpdateOperationsInput | $Enums.UserStatus
    email_verified?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    last_login_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    documents?: DocumentUncheckedUpdateManyWithoutOwnerNestedInput
    chat_sessions?: ChatSessionUncheckedUpdateManyWithoutUserNestedInput
    verification_tokens?: VerificationTokenUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateWithoutVerification_tokensInput = {
    id?: string
    name?: string | null
    email: string
    password: string
    job_title?: string | null
    profile_picture?: string | null
    is_paid_user?: boolean
    two_factor_enabled?: boolean
    two_factor_secret?: string | null
    ai_personality?: string | null
    status?: $Enums.UserStatus
    email_verified?: boolean
    created_at?: Date | string
    updated_at?: Date | string
    last_login_at?: Date | string | null
    documents?: DocumentCreateNestedManyWithoutOwnerInput
    chat_sessions?: ChatSessionCreateNestedManyWithoutUserInput
    security_logs?: SecurityLogCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutVerification_tokensInput = {
    id?: string
    name?: string | null
    email: string
    password: string
    job_title?: string | null
    profile_picture?: string | null
    is_paid_user?: boolean
    two_factor_enabled?: boolean
    two_factor_secret?: string | null
    ai_personality?: string | null
    status?: $Enums.UserStatus
    email_verified?: boolean
    created_at?: Date | string
    updated_at?: Date | string
    last_login_at?: Date | string | null
    documents?: DocumentUncheckedCreateNestedManyWithoutOwnerInput
    chat_sessions?: ChatSessionUncheckedCreateNestedManyWithoutUserInput
    security_logs?: SecurityLogUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutVerification_tokensInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutVerification_tokensInput, UserUncheckedCreateWithoutVerification_tokensInput>
  }

  export type UserUpsertWithoutVerification_tokensInput = {
    update: XOR<UserUpdateWithoutVerification_tokensInput, UserUncheckedUpdateWithoutVerification_tokensInput>
    create: XOR<UserCreateWithoutVerification_tokensInput, UserUncheckedCreateWithoutVerification_tokensInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutVerification_tokensInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutVerification_tokensInput, UserUncheckedUpdateWithoutVerification_tokensInput>
  }

  export type UserUpdateWithoutVerification_tokensInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    job_title?: NullableStringFieldUpdateOperationsInput | string | null
    profile_picture?: NullableStringFieldUpdateOperationsInput | string | null
    is_paid_user?: BoolFieldUpdateOperationsInput | boolean
    two_factor_enabled?: BoolFieldUpdateOperationsInput | boolean
    two_factor_secret?: NullableStringFieldUpdateOperationsInput | string | null
    ai_personality?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumUserStatusFieldUpdateOperationsInput | $Enums.UserStatus
    email_verified?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    last_login_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    documents?: DocumentUpdateManyWithoutOwnerNestedInput
    chat_sessions?: ChatSessionUpdateManyWithoutUserNestedInput
    security_logs?: SecurityLogUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutVerification_tokensInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    job_title?: NullableStringFieldUpdateOperationsInput | string | null
    profile_picture?: NullableStringFieldUpdateOperationsInput | string | null
    is_paid_user?: BoolFieldUpdateOperationsInput | boolean
    two_factor_enabled?: BoolFieldUpdateOperationsInput | boolean
    two_factor_secret?: NullableStringFieldUpdateOperationsInput | string | null
    ai_personality?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumUserStatusFieldUpdateOperationsInput | $Enums.UserStatus
    email_verified?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    last_login_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    documents?: DocumentUncheckedUpdateManyWithoutOwnerNestedInput
    chat_sessions?: ChatSessionUncheckedUpdateManyWithoutUserNestedInput
    security_logs?: SecurityLogUncheckedUpdateManyWithoutUserNestedInput
  }

  export type DocumentCreateManyOwnerInput = {
    id?: string
    file_name: string
    original_file_name: string
    file_path: string
    file_size: number
    mime_type: string
    status?: $Enums.DocumentStatus
    is_scanned?: boolean | null
    page_count?: number | null
    uploaded_at?: Date | string
    updated_at?: Date | string
  }

  export type ChatSessionCreateManyUserInput = {
    id?: string
    title?: string | null
    document_id: string
    is_saved?: boolean
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type SecurityLogCreateManyUserInput = {
    id?: string
    action: $Enums.SecurityAction
    details?: string | null
    ip_address?: string | null
    user_agent?: string | null
    created_at?: Date | string
  }

  export type VerificationTokenCreateManyUserInput = {
    id?: string
    email: string
    key: string
    token: string
    type?: $Enums.TokenType
    expires_at: Date | string
    used?: boolean
    created_at?: Date | string
  }

  export type DocumentUpdateWithoutOwnerInput = {
    id?: StringFieldUpdateOperationsInput | string
    file_name?: StringFieldUpdateOperationsInput | string
    original_file_name?: StringFieldUpdateOperationsInput | string
    file_path?: StringFieldUpdateOperationsInput | string
    file_size?: IntFieldUpdateOperationsInput | number
    mime_type?: StringFieldUpdateOperationsInput | string
    status?: EnumDocumentStatusFieldUpdateOperationsInput | $Enums.DocumentStatus
    is_scanned?: NullableBoolFieldUpdateOperationsInput | boolean | null
    page_count?: NullableIntFieldUpdateOperationsInput | number | null
    uploaded_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    chat_sessions?: ChatSessionUpdateManyWithoutDocumentNestedInput
  }

  export type DocumentUncheckedUpdateWithoutOwnerInput = {
    id?: StringFieldUpdateOperationsInput | string
    file_name?: StringFieldUpdateOperationsInput | string
    original_file_name?: StringFieldUpdateOperationsInput | string
    file_path?: StringFieldUpdateOperationsInput | string
    file_size?: IntFieldUpdateOperationsInput | number
    mime_type?: StringFieldUpdateOperationsInput | string
    status?: EnumDocumentStatusFieldUpdateOperationsInput | $Enums.DocumentStatus
    is_scanned?: NullableBoolFieldUpdateOperationsInput | boolean | null
    page_count?: NullableIntFieldUpdateOperationsInput | number | null
    uploaded_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    chat_sessions?: ChatSessionUncheckedUpdateManyWithoutDocumentNestedInput
  }

  export type DocumentUncheckedUpdateManyWithoutOwnerInput = {
    id?: StringFieldUpdateOperationsInput | string
    file_name?: StringFieldUpdateOperationsInput | string
    original_file_name?: StringFieldUpdateOperationsInput | string
    file_path?: StringFieldUpdateOperationsInput | string
    file_size?: IntFieldUpdateOperationsInput | number
    mime_type?: StringFieldUpdateOperationsInput | string
    status?: EnumDocumentStatusFieldUpdateOperationsInput | $Enums.DocumentStatus
    is_scanned?: NullableBoolFieldUpdateOperationsInput | boolean | null
    page_count?: NullableIntFieldUpdateOperationsInput | number | null
    uploaded_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChatSessionUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    is_saved?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    document?: DocumentUpdateOneRequiredWithoutChat_sessionsNestedInput
    messages?: ChatMessageUpdateManyWithoutSessionNestedInput
  }

  export type ChatSessionUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    document_id?: StringFieldUpdateOperationsInput | string
    is_saved?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    messages?: ChatMessageUncheckedUpdateManyWithoutSessionNestedInput
  }

  export type ChatSessionUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    document_id?: StringFieldUpdateOperationsInput | string
    is_saved?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SecurityLogUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    action?: EnumSecurityActionFieldUpdateOperationsInput | $Enums.SecurityAction
    details?: NullableStringFieldUpdateOperationsInput | string | null
    ip_address?: NullableStringFieldUpdateOperationsInput | string | null
    user_agent?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SecurityLogUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    action?: EnumSecurityActionFieldUpdateOperationsInput | $Enums.SecurityAction
    details?: NullableStringFieldUpdateOperationsInput | string | null
    ip_address?: NullableStringFieldUpdateOperationsInput | string | null
    user_agent?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SecurityLogUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    action?: EnumSecurityActionFieldUpdateOperationsInput | $Enums.SecurityAction
    details?: NullableStringFieldUpdateOperationsInput | string | null
    ip_address?: NullableStringFieldUpdateOperationsInput | string | null
    user_agent?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VerificationTokenUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    type?: EnumTokenTypeFieldUpdateOperationsInput | $Enums.TokenType
    expires_at?: DateTimeFieldUpdateOperationsInput | Date | string
    used?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VerificationTokenUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    type?: EnumTokenTypeFieldUpdateOperationsInput | $Enums.TokenType
    expires_at?: DateTimeFieldUpdateOperationsInput | Date | string
    used?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VerificationTokenUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    type?: EnumTokenTypeFieldUpdateOperationsInput | $Enums.TokenType
    expires_at?: DateTimeFieldUpdateOperationsInput | Date | string
    used?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChatSessionCreateManyDocumentInput = {
    id?: string
    title?: string | null
    user_id: string
    is_saved?: boolean
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type ChatSessionUpdateWithoutDocumentInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    is_saved?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutChat_sessionsNestedInput
    messages?: ChatMessageUpdateManyWithoutSessionNestedInput
  }

  export type ChatSessionUncheckedUpdateWithoutDocumentInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    user_id?: StringFieldUpdateOperationsInput | string
    is_saved?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    messages?: ChatMessageUncheckedUpdateManyWithoutSessionNestedInput
  }

  export type ChatSessionUncheckedUpdateManyWithoutDocumentInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    user_id?: StringFieldUpdateOperationsInput | string
    is_saved?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChatMessageCreateManySessionInput = {
    id?: string
    role: $Enums.MessageRole
    content: string
    source_nodes?: NullableJsonNullValueInput | InputJsonValue
    tokens_used?: number | null
    created_at?: Date | string
  }

  export type ChatMessageUpdateWithoutSessionInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: EnumMessageRoleFieldUpdateOperationsInput | $Enums.MessageRole
    content?: StringFieldUpdateOperationsInput | string
    source_nodes?: NullableJsonNullValueInput | InputJsonValue
    tokens_used?: NullableIntFieldUpdateOperationsInput | number | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChatMessageUncheckedUpdateWithoutSessionInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: EnumMessageRoleFieldUpdateOperationsInput | $Enums.MessageRole
    content?: StringFieldUpdateOperationsInput | string
    source_nodes?: NullableJsonNullValueInput | InputJsonValue
    tokens_used?: NullableIntFieldUpdateOperationsInput | number | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChatMessageUncheckedUpdateManyWithoutSessionInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: EnumMessageRoleFieldUpdateOperationsInput | $Enums.MessageRole
    content?: StringFieldUpdateOperationsInput | string
    source_nodes?: NullableJsonNullValueInput | InputJsonValue
    tokens_used?: NullableIntFieldUpdateOperationsInput | number | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}