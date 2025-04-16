
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
 * Model AppsCategory
 * 
 */
export type AppsCategory = $Result.DefaultSelection<Prisma.$AppsCategoryPayload>
/**
 * Model ScreenGesture
 * 
 */
export type ScreenGesture = $Result.DefaultSelection<Prisma.$ScreenGesturePayload>
/**
 * Model AppMetadata
 * 
 */
export type AppMetadata = $Result.DefaultSelection<Prisma.$AppMetadataPayload>
/**
 * Model App
 * 
 */
export type App = $Result.DefaultSelection<Prisma.$AppPayload>
/**
 * Model Redaction
 * 
 */
export type Redaction = $Result.DefaultSelection<Prisma.$RedactionPayload>
/**
 * Model Screen
 * 
 */
export type Screen = $Result.DefaultSelection<Prisma.$ScreenPayload>
/**
 * Model Trace
 * 
 */
export type Trace = $Result.DefaultSelection<Prisma.$TracePayload>
/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model Task
 * 
 */
export type Task = $Result.DefaultSelection<Prisma.$TaskPayload>
/**
 * Model Capture
 * 
 */
export type Capture = $Result.DefaultSelection<Prisma.$CapturePayload>

/**
 * Enums
 */
export namespace $Enums {
  export const Role: {
  USER: 'USER',
  ADMIN: 'ADMIN'
};

export type Role = (typeof Role)[keyof typeof Role]

}

export type Role = $Enums.Role

export const Role: typeof $Enums.Role

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Apps
 * const apps = await prisma.app.findMany()
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
   * // Fetch zero or more Apps
   * const apps = await prisma.app.findMany()
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
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P]): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number }): $Utils.JsPromise<R>

  /**
   * Executes a raw MongoDB command and returns the result of it.
   * @example
   * ```
   * const user = await prisma.$runCommandRaw({
   *   aggregate: 'User',
   *   pipeline: [{ $match: { name: 'Bob' } }, { $project: { email: true, _id: false } }],
   *   explain: false,
   * })
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $runCommandRaw(command: Prisma.InputJsonObject): Prisma.PrismaPromise<Prisma.JsonObject>

  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.app`: Exposes CRUD operations for the **App** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Apps
    * const apps = await prisma.app.findMany()
    * ```
    */
  get app(): Prisma.AppDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.redaction`: Exposes CRUD operations for the **Redaction** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Redactions
    * const redactions = await prisma.redaction.findMany()
    * ```
    */
  get redaction(): Prisma.RedactionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.screen`: Exposes CRUD operations for the **Screen** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Screens
    * const screens = await prisma.screen.findMany()
    * ```
    */
  get screen(): Prisma.ScreenDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.trace`: Exposes CRUD operations for the **Trace** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Traces
    * const traces = await prisma.trace.findMany()
    * ```
    */
  get trace(): Prisma.TraceDelegate<ExtArgs, ClientOptions>;

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
   * `prisma.task`: Exposes CRUD operations for the **Task** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Tasks
    * const tasks = await prisma.task.findMany()
    * ```
    */
  get task(): Prisma.TaskDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.capture`: Exposes CRUD operations for the **Capture** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Captures
    * const captures = await prisma.capture.findMany()
    * ```
    */
  get capture(): Prisma.CaptureDelegate<ExtArgs, ClientOptions>;
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
   * Prisma Client JS version: 6.6.0
   * Query Engine version: f676762280b54cd07c770017ed3711ddde35f37a
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
    App: 'App',
    Redaction: 'Redaction',
    Screen: 'Screen',
    Trace: 'Trace',
    User: 'User',
    Task: 'Task',
    Capture: 'Capture'
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
      modelProps: "app" | "redaction" | "screen" | "trace" | "user" | "task" | "capture"
      txIsolationLevel: never
    }
    model: {
      App: {
        payload: Prisma.$AppPayload<ExtArgs>
        fields: Prisma.AppFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AppFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AppFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppPayload>
          }
          findFirst: {
            args: Prisma.AppFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AppFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppPayload>
          }
          findMany: {
            args: Prisma.AppFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppPayload>[]
          }
          create: {
            args: Prisma.AppCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppPayload>
          }
          createMany: {
            args: Prisma.AppCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.AppDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppPayload>
          }
          update: {
            args: Prisma.AppUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppPayload>
          }
          deleteMany: {
            args: Prisma.AppDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AppUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.AppUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppPayload>
          }
          aggregate: {
            args: Prisma.AppAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateApp>
          }
          groupBy: {
            args: Prisma.AppGroupByArgs<ExtArgs>
            result: $Utils.Optional<AppGroupByOutputType>[]
          }
          findRaw: {
            args: Prisma.AppFindRawArgs<ExtArgs>
            result: JsonObject
          }
          aggregateRaw: {
            args: Prisma.AppAggregateRawArgs<ExtArgs>
            result: JsonObject
          }
          count: {
            args: Prisma.AppCountArgs<ExtArgs>
            result: $Utils.Optional<AppCountAggregateOutputType> | number
          }
        }
      }
      Redaction: {
        payload: Prisma.$RedactionPayload<ExtArgs>
        fields: Prisma.RedactionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.RedactionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RedactionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.RedactionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RedactionPayload>
          }
          findFirst: {
            args: Prisma.RedactionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RedactionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.RedactionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RedactionPayload>
          }
          findMany: {
            args: Prisma.RedactionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RedactionPayload>[]
          }
          create: {
            args: Prisma.RedactionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RedactionPayload>
          }
          createMany: {
            args: Prisma.RedactionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.RedactionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RedactionPayload>
          }
          update: {
            args: Prisma.RedactionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RedactionPayload>
          }
          deleteMany: {
            args: Prisma.RedactionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.RedactionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.RedactionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RedactionPayload>
          }
          aggregate: {
            args: Prisma.RedactionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateRedaction>
          }
          groupBy: {
            args: Prisma.RedactionGroupByArgs<ExtArgs>
            result: $Utils.Optional<RedactionGroupByOutputType>[]
          }
          findRaw: {
            args: Prisma.RedactionFindRawArgs<ExtArgs>
            result: JsonObject
          }
          aggregateRaw: {
            args: Prisma.RedactionAggregateRawArgs<ExtArgs>
            result: JsonObject
          }
          count: {
            args: Prisma.RedactionCountArgs<ExtArgs>
            result: $Utils.Optional<RedactionCountAggregateOutputType> | number
          }
        }
      }
      Screen: {
        payload: Prisma.$ScreenPayload<ExtArgs>
        fields: Prisma.ScreenFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ScreenFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScreenPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ScreenFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScreenPayload>
          }
          findFirst: {
            args: Prisma.ScreenFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScreenPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ScreenFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScreenPayload>
          }
          findMany: {
            args: Prisma.ScreenFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScreenPayload>[]
          }
          create: {
            args: Prisma.ScreenCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScreenPayload>
          }
          createMany: {
            args: Prisma.ScreenCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.ScreenDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScreenPayload>
          }
          update: {
            args: Prisma.ScreenUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScreenPayload>
          }
          deleteMany: {
            args: Prisma.ScreenDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ScreenUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ScreenUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScreenPayload>
          }
          aggregate: {
            args: Prisma.ScreenAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateScreen>
          }
          groupBy: {
            args: Prisma.ScreenGroupByArgs<ExtArgs>
            result: $Utils.Optional<ScreenGroupByOutputType>[]
          }
          findRaw: {
            args: Prisma.ScreenFindRawArgs<ExtArgs>
            result: JsonObject
          }
          aggregateRaw: {
            args: Prisma.ScreenAggregateRawArgs<ExtArgs>
            result: JsonObject
          }
          count: {
            args: Prisma.ScreenCountArgs<ExtArgs>
            result: $Utils.Optional<ScreenCountAggregateOutputType> | number
          }
        }
      }
      Trace: {
        payload: Prisma.$TracePayload<ExtArgs>
        fields: Prisma.TraceFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TraceFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TracePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TraceFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TracePayload>
          }
          findFirst: {
            args: Prisma.TraceFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TracePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TraceFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TracePayload>
          }
          findMany: {
            args: Prisma.TraceFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TracePayload>[]
          }
          create: {
            args: Prisma.TraceCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TracePayload>
          }
          createMany: {
            args: Prisma.TraceCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.TraceDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TracePayload>
          }
          update: {
            args: Prisma.TraceUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TracePayload>
          }
          deleteMany: {
            args: Prisma.TraceDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TraceUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.TraceUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TracePayload>
          }
          aggregate: {
            args: Prisma.TraceAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTrace>
          }
          groupBy: {
            args: Prisma.TraceGroupByArgs<ExtArgs>
            result: $Utils.Optional<TraceGroupByOutputType>[]
          }
          findRaw: {
            args: Prisma.TraceFindRawArgs<ExtArgs>
            result: JsonObject
          }
          aggregateRaw: {
            args: Prisma.TraceAggregateRawArgs<ExtArgs>
            result: JsonObject
          }
          count: {
            args: Prisma.TraceCountArgs<ExtArgs>
            result: $Utils.Optional<TraceCountAggregateOutputType> | number
          }
        }
      }
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
          findRaw: {
            args: Prisma.UserFindRawArgs<ExtArgs>
            result: JsonObject
          }
          aggregateRaw: {
            args: Prisma.UserAggregateRawArgs<ExtArgs>
            result: JsonObject
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      Task: {
        payload: Prisma.$TaskPayload<ExtArgs>
        fields: Prisma.TaskFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TaskFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TaskPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TaskFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TaskPayload>
          }
          findFirst: {
            args: Prisma.TaskFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TaskPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TaskFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TaskPayload>
          }
          findMany: {
            args: Prisma.TaskFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TaskPayload>[]
          }
          create: {
            args: Prisma.TaskCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TaskPayload>
          }
          createMany: {
            args: Prisma.TaskCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.TaskDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TaskPayload>
          }
          update: {
            args: Prisma.TaskUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TaskPayload>
          }
          deleteMany: {
            args: Prisma.TaskDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TaskUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.TaskUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TaskPayload>
          }
          aggregate: {
            args: Prisma.TaskAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTask>
          }
          groupBy: {
            args: Prisma.TaskGroupByArgs<ExtArgs>
            result: $Utils.Optional<TaskGroupByOutputType>[]
          }
          findRaw: {
            args: Prisma.TaskFindRawArgs<ExtArgs>
            result: JsonObject
          }
          aggregateRaw: {
            args: Prisma.TaskAggregateRawArgs<ExtArgs>
            result: JsonObject
          }
          count: {
            args: Prisma.TaskCountArgs<ExtArgs>
            result: $Utils.Optional<TaskCountAggregateOutputType> | number
          }
        }
      }
      Capture: {
        payload: Prisma.$CapturePayload<ExtArgs>
        fields: Prisma.CaptureFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CaptureFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CapturePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CaptureFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CapturePayload>
          }
          findFirst: {
            args: Prisma.CaptureFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CapturePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CaptureFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CapturePayload>
          }
          findMany: {
            args: Prisma.CaptureFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CapturePayload>[]
          }
          create: {
            args: Prisma.CaptureCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CapturePayload>
          }
          createMany: {
            args: Prisma.CaptureCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.CaptureDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CapturePayload>
          }
          update: {
            args: Prisma.CaptureUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CapturePayload>
          }
          deleteMany: {
            args: Prisma.CaptureDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CaptureUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.CaptureUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CapturePayload>
          }
          aggregate: {
            args: Prisma.CaptureAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCapture>
          }
          groupBy: {
            args: Prisma.CaptureGroupByArgs<ExtArgs>
            result: $Utils.Optional<CaptureGroupByOutputType>[]
          }
          findRaw: {
            args: Prisma.CaptureFindRawArgs<ExtArgs>
            result: JsonObject
          }
          aggregateRaw: {
            args: Prisma.CaptureAggregateRawArgs<ExtArgs>
            result: JsonObject
          }
          count: {
            args: Prisma.CaptureCountArgs<ExtArgs>
            result: $Utils.Optional<CaptureCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $runCommandRaw: {
          args: Prisma.InputJsonObject,
          result: Prisma.JsonObject
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
    app?: AppOmit
    redaction?: RedactionOmit
    screen?: ScreenOmit
    trace?: TraceOmit
    user?: UserOmit
    task?: TaskOmit
    capture?: CaptureOmit
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
   * Count Type AppCountOutputType
   */

  export type AppCountOutputType = {
    Capture: number
  }

  export type AppCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    Capture?: boolean | AppCountOutputTypeCountCaptureArgs
  }

  // Custom InputTypes
  /**
   * AppCountOutputType without action
   */
  export type AppCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AppCountOutputType
     */
    select?: AppCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * AppCountOutputType without action
   */
  export type AppCountOutputTypeCountCaptureArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CaptureWhereInput
  }


  /**
   * Count Type TraceCountOutputType
   */

  export type TraceCountOutputType = {
    screens: number
  }

  export type TraceCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    screens?: boolean | TraceCountOutputTypeCountScreensArgs
  }

  // Custom InputTypes
  /**
   * TraceCountOutputType without action
   */
  export type TraceCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TraceCountOutputType
     */
    select?: TraceCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * TraceCountOutputType without action
   */
  export type TraceCountOutputTypeCountScreensArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ScreenWhereInput
  }


  /**
   * Count Type TaskCountOutputType
   */

  export type TaskCountOutputType = {
    traces: number
    Capture: number
  }

  export type TaskCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    traces?: boolean | TaskCountOutputTypeCountTracesArgs
    Capture?: boolean | TaskCountOutputTypeCountCaptureArgs
  }

  // Custom InputTypes
  /**
   * TaskCountOutputType without action
   */
  export type TaskCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TaskCountOutputType
     */
    select?: TaskCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * TaskCountOutputType without action
   */
  export type TaskCountOutputTypeCountTracesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TraceWhereInput
  }

  /**
   * TaskCountOutputType without action
   */
  export type TaskCountOutputTypeCountCaptureArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CaptureWhereInput
  }


  /**
   * Models
   */

  /**
   * Model AppsCategory
   */





  export type AppsCategorySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
  }, ExtArgs["result"]["appsCategory"]>



  export type AppsCategorySelectScalar = {
    id?: boolean
    name?: boolean
  }

  export type AppsCategoryOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name", ExtArgs["result"]["appsCategory"]>

  export type $AppsCategoryPayload = {
    name: "AppsCategory"
    objects: {}
    scalars: {
      id: string
      name: string
    }
    composites: {}
  }

  type AppsCategoryGetPayload<S extends boolean | null | undefined | AppsCategoryDefaultArgs> = $Result.GetResult<Prisma.$AppsCategoryPayload, S>





  /**
   * Fields of the AppsCategory model
   */
  interface AppsCategoryFieldRefs {
    readonly id: FieldRef<"AppsCategory", 'String'>
    readonly name: FieldRef<"AppsCategory", 'String'>
  }
    

  // Custom InputTypes
  /**
   * AppsCategory without action
   */
  export type AppsCategoryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AppsCategory
     */
    select?: AppsCategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the AppsCategory
     */
    omit?: AppsCategoryOmit<ExtArgs> | null
  }


  /**
   * Model ScreenGesture
   */





  export type ScreenGestureSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    type?: boolean
    scrollDeltaX?: boolean
    scrollDeltaY?: boolean
    x?: boolean
    y?: boolean
    description?: boolean
  }, ExtArgs["result"]["screenGesture"]>



  export type ScreenGestureSelectScalar = {
    type?: boolean
    scrollDeltaX?: boolean
    scrollDeltaY?: boolean
    x?: boolean
    y?: boolean
    description?: boolean
  }

  export type ScreenGestureOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"type" | "scrollDeltaX" | "scrollDeltaY" | "x" | "y" | "description", ExtArgs["result"]["screenGesture"]>

  export type $ScreenGesturePayload = {
    name: "ScreenGesture"
    objects: {}
    scalars: {
      type: string | null
      scrollDeltaX: number | null
      scrollDeltaY: number | null
      x: number | null
      y: number | null
      description: string | null
    }
    composites: {}
  }

  type ScreenGestureGetPayload<S extends boolean | null | undefined | ScreenGestureDefaultArgs> = $Result.GetResult<Prisma.$ScreenGesturePayload, S>





  /**
   * Fields of the ScreenGesture model
   */
  interface ScreenGestureFieldRefs {
    readonly type: FieldRef<"ScreenGesture", 'String'>
    readonly scrollDeltaX: FieldRef<"ScreenGesture", 'Float'>
    readonly scrollDeltaY: FieldRef<"ScreenGesture", 'Float'>
    readonly x: FieldRef<"ScreenGesture", 'Float'>
    readonly y: FieldRef<"ScreenGesture", 'Float'>
    readonly description: FieldRef<"ScreenGesture", 'String'>
  }
    

  // Custom InputTypes
  /**
   * ScreenGesture without action
   */
  export type ScreenGestureDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ScreenGesture
     */
    select?: ScreenGestureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ScreenGesture
     */
    omit?: ScreenGestureOmit<ExtArgs> | null
  }


  /**
   * Model AppMetadata
   */





  export type AppMetadataSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    company?: boolean
    name?: boolean
    cover?: boolean
    description?: boolean
    icon?: boolean
    rating?: boolean
    reviews?: boolean
    genre?: boolean
    downloads?: boolean
    url?: boolean
  }, ExtArgs["result"]["appMetadata"]>



  export type AppMetadataSelectScalar = {
    company?: boolean
    name?: boolean
    cover?: boolean
    description?: boolean
    icon?: boolean
    rating?: boolean
    reviews?: boolean
    genre?: boolean
    downloads?: boolean
    url?: boolean
  }

  export type AppMetadataOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"company" | "name" | "cover" | "description" | "icon" | "rating" | "reviews" | "genre" | "downloads" | "url", ExtArgs["result"]["appMetadata"]>

  export type $AppMetadataPayload = {
    name: "AppMetadata"
    objects: {}
    scalars: {
      company: string
      name: string
      cover: string
      description: string
      icon: string
      rating: number
      reviews: number | null
      genre: string[]
      downloads: string
      url: string
    }
    composites: {}
  }

  type AppMetadataGetPayload<S extends boolean | null | undefined | AppMetadataDefaultArgs> = $Result.GetResult<Prisma.$AppMetadataPayload, S>





  /**
   * Fields of the AppMetadata model
   */
  interface AppMetadataFieldRefs {
    readonly company: FieldRef<"AppMetadata", 'String'>
    readonly name: FieldRef<"AppMetadata", 'String'>
    readonly cover: FieldRef<"AppMetadata", 'String'>
    readonly description: FieldRef<"AppMetadata", 'String'>
    readonly icon: FieldRef<"AppMetadata", 'String'>
    readonly rating: FieldRef<"AppMetadata", 'Float'>
    readonly reviews: FieldRef<"AppMetadata", 'Float'>
    readonly genre: FieldRef<"AppMetadata", 'String[]'>
    readonly downloads: FieldRef<"AppMetadata", 'String'>
    readonly url: FieldRef<"AppMetadata", 'String'>
  }
    

  // Custom InputTypes
  /**
   * AppMetadata without action
   */
  export type AppMetadataDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AppMetadata
     */
    select?: AppMetadataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AppMetadata
     */
    omit?: AppMetadataOmit<ExtArgs> | null
  }


  /**
   * Model App
   */

  export type AggregateApp = {
    _count: AppCountAggregateOutputType | null
    _avg: AppAvgAggregateOutputType | null
    _sum: AppSumAggregateOutputType | null
    _min: AppMinAggregateOutputType | null
    _max: AppMaxAggregateOutputType | null
  }

  export type AppAvgAggregateOutputType = {
    v: number | null
  }

  export type AppSumAggregateOutputType = {
    v: number | null
  }

  export type AppMinAggregateOutputType = {
    id: string | null
    v: number | null
    packageName: string | null
  }

  export type AppMaxAggregateOutputType = {
    id: string | null
    v: number | null
    packageName: string | null
  }

  export type AppCountAggregateOutputType = {
    id: number
    v: number
    packageName: number
    _all: number
  }


  export type AppAvgAggregateInputType = {
    v?: true
  }

  export type AppSumAggregateInputType = {
    v?: true
  }

  export type AppMinAggregateInputType = {
    id?: true
    v?: true
    packageName?: true
  }

  export type AppMaxAggregateInputType = {
    id?: true
    v?: true
    packageName?: true
  }

  export type AppCountAggregateInputType = {
    id?: true
    v?: true
    packageName?: true
    _all?: true
  }

  export type AppAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which App to aggregate.
     */
    where?: AppWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Apps to fetch.
     */
    orderBy?: AppOrderByWithRelationInput | AppOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AppWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Apps from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Apps.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Apps
    **/
    _count?: true | AppCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: AppAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: AppSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AppMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AppMaxAggregateInputType
  }

  export type GetAppAggregateType<T extends AppAggregateArgs> = {
        [P in keyof T & keyof AggregateApp]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateApp[P]>
      : GetScalarType<T[P], AggregateApp[P]>
  }




  export type AppGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AppWhereInput
    orderBy?: AppOrderByWithAggregationInput | AppOrderByWithAggregationInput[]
    by: AppScalarFieldEnum[] | AppScalarFieldEnum
    having?: AppScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AppCountAggregateInputType | true
    _avg?: AppAvgAggregateInputType
    _sum?: AppSumAggregateInputType
    _min?: AppMinAggregateInputType
    _max?: AppMaxAggregateInputType
  }

  export type AppGroupByOutputType = {
    id: string
    v: number | null
    packageName: string
    _count: AppCountAggregateOutputType | null
    _avg: AppAvgAggregateOutputType | null
    _sum: AppSumAggregateOutputType | null
    _min: AppMinAggregateOutputType | null
    _max: AppMaxAggregateOutputType | null
  }

  type GetAppGroupByPayload<T extends AppGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AppGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AppGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AppGroupByOutputType[P]>
            : GetScalarType<T[P], AppGroupByOutputType[P]>
        }
      >
    >


  export type AppSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    v?: boolean
    category?: boolean | AppsCategoryDefaultArgs<ExtArgs>
    packageName?: boolean
    metadata?: boolean | AppMetadataDefaultArgs<ExtArgs>
    Capture?: boolean | App$CaptureArgs<ExtArgs>
    _count?: boolean | AppCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["app"]>



  export type AppSelectScalar = {
    id?: boolean
    v?: boolean
    packageName?: boolean
  }

  export type AppOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "v" | "category" | "packageName" | "metadata", ExtArgs["result"]["app"]>
  export type AppInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    Capture?: boolean | App$CaptureArgs<ExtArgs>
    _count?: boolean | AppCountOutputTypeDefaultArgs<ExtArgs>
  }

  export type $AppPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "App"
    objects: {
      Capture: Prisma.$CapturePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      v: number | null
      packageName: string
    }, ExtArgs["result"]["app"]>
    composites: {
      category: Prisma.$AppsCategoryPayload | null
      metadata: Prisma.$AppMetadataPayload
    }
  }

  type AppGetPayload<S extends boolean | null | undefined | AppDefaultArgs> = $Result.GetResult<Prisma.$AppPayload, S>

  type AppCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AppFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AppCountAggregateInputType | true
    }

  export interface AppDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['App'], meta: { name: 'App' } }
    /**
     * Find zero or one App that matches the filter.
     * @param {AppFindUniqueArgs} args - Arguments to find a App
     * @example
     * // Get one App
     * const app = await prisma.app.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AppFindUniqueArgs>(args: SelectSubset<T, AppFindUniqueArgs<ExtArgs>>): Prisma__AppClient<$Result.GetResult<Prisma.$AppPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one App that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AppFindUniqueOrThrowArgs} args - Arguments to find a App
     * @example
     * // Get one App
     * const app = await prisma.app.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AppFindUniqueOrThrowArgs>(args: SelectSubset<T, AppFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AppClient<$Result.GetResult<Prisma.$AppPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first App that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AppFindFirstArgs} args - Arguments to find a App
     * @example
     * // Get one App
     * const app = await prisma.app.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AppFindFirstArgs>(args?: SelectSubset<T, AppFindFirstArgs<ExtArgs>>): Prisma__AppClient<$Result.GetResult<Prisma.$AppPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first App that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AppFindFirstOrThrowArgs} args - Arguments to find a App
     * @example
     * // Get one App
     * const app = await prisma.app.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AppFindFirstOrThrowArgs>(args?: SelectSubset<T, AppFindFirstOrThrowArgs<ExtArgs>>): Prisma__AppClient<$Result.GetResult<Prisma.$AppPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Apps that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AppFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Apps
     * const apps = await prisma.app.findMany()
     * 
     * // Get first 10 Apps
     * const apps = await prisma.app.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const appWithIdOnly = await prisma.app.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AppFindManyArgs>(args?: SelectSubset<T, AppFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AppPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a App.
     * @param {AppCreateArgs} args - Arguments to create a App.
     * @example
     * // Create one App
     * const App = await prisma.app.create({
     *   data: {
     *     // ... data to create a App
     *   }
     * })
     * 
     */
    create<T extends AppCreateArgs>(args: SelectSubset<T, AppCreateArgs<ExtArgs>>): Prisma__AppClient<$Result.GetResult<Prisma.$AppPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Apps.
     * @param {AppCreateManyArgs} args - Arguments to create many Apps.
     * @example
     * // Create many Apps
     * const app = await prisma.app.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AppCreateManyArgs>(args?: SelectSubset<T, AppCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a App.
     * @param {AppDeleteArgs} args - Arguments to delete one App.
     * @example
     * // Delete one App
     * const App = await prisma.app.delete({
     *   where: {
     *     // ... filter to delete one App
     *   }
     * })
     * 
     */
    delete<T extends AppDeleteArgs>(args: SelectSubset<T, AppDeleteArgs<ExtArgs>>): Prisma__AppClient<$Result.GetResult<Prisma.$AppPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one App.
     * @param {AppUpdateArgs} args - Arguments to update one App.
     * @example
     * // Update one App
     * const app = await prisma.app.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AppUpdateArgs>(args: SelectSubset<T, AppUpdateArgs<ExtArgs>>): Prisma__AppClient<$Result.GetResult<Prisma.$AppPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Apps.
     * @param {AppDeleteManyArgs} args - Arguments to filter Apps to delete.
     * @example
     * // Delete a few Apps
     * const { count } = await prisma.app.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AppDeleteManyArgs>(args?: SelectSubset<T, AppDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Apps.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AppUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Apps
     * const app = await prisma.app.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AppUpdateManyArgs>(args: SelectSubset<T, AppUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one App.
     * @param {AppUpsertArgs} args - Arguments to update or create a App.
     * @example
     * // Update or create a App
     * const app = await prisma.app.upsert({
     *   create: {
     *     // ... data to create a App
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the App we want to update
     *   }
     * })
     */
    upsert<T extends AppUpsertArgs>(args: SelectSubset<T, AppUpsertArgs<ExtArgs>>): Prisma__AppClient<$Result.GetResult<Prisma.$AppPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Apps that matches the filter.
     * @param {AppFindRawArgs} args - Select which filters you would like to apply.
     * @example
     * const app = await prisma.app.findRaw({
     *   filter: { age: { $gt: 25 } }
     * })
     */
    findRaw(args?: AppFindRawArgs): Prisma.PrismaPromise<JsonObject>

    /**
     * Perform aggregation operations on a App.
     * @param {AppAggregateRawArgs} args - Select which aggregations you would like to apply.
     * @example
     * const app = await prisma.app.aggregateRaw({
     *   pipeline: [
     *     { $match: { status: "registered" } },
     *     { $group: { _id: "$country", total: { $sum: 1 } } }
     *   ]
     * })
     */
    aggregateRaw(args?: AppAggregateRawArgs): Prisma.PrismaPromise<JsonObject>


    /**
     * Count the number of Apps.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AppCountArgs} args - Arguments to filter Apps to count.
     * @example
     * // Count the number of Apps
     * const count = await prisma.app.count({
     *   where: {
     *     // ... the filter for the Apps we want to count
     *   }
     * })
    **/
    count<T extends AppCountArgs>(
      args?: Subset<T, AppCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AppCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a App.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AppAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends AppAggregateArgs>(args: Subset<T, AppAggregateArgs>): Prisma.PrismaPromise<GetAppAggregateType<T>>

    /**
     * Group by App.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AppGroupByArgs} args - Group by arguments.
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
      T extends AppGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AppGroupByArgs['orderBy'] }
        : { orderBy?: AppGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, AppGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAppGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the App model
   */
  readonly fields: AppFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for App.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AppClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    Capture<T extends App$CaptureArgs<ExtArgs> = {}>(args?: Subset<T, App$CaptureArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CapturePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
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
   * Fields of the App model
   */
  interface AppFieldRefs {
    readonly id: FieldRef<"App", 'String'>
    readonly v: FieldRef<"App", 'Int'>
    readonly packageName: FieldRef<"App", 'String'>
  }
    

  // Custom InputTypes
  /**
   * App findUnique
   */
  export type AppFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the App
     */
    select?: AppSelect<ExtArgs> | null
    /**
     * Omit specific fields from the App
     */
    omit?: AppOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AppInclude<ExtArgs> | null
    /**
     * Filter, which App to fetch.
     */
    where: AppWhereUniqueInput
  }

  /**
   * App findUniqueOrThrow
   */
  export type AppFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the App
     */
    select?: AppSelect<ExtArgs> | null
    /**
     * Omit specific fields from the App
     */
    omit?: AppOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AppInclude<ExtArgs> | null
    /**
     * Filter, which App to fetch.
     */
    where: AppWhereUniqueInput
  }

  /**
   * App findFirst
   */
  export type AppFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the App
     */
    select?: AppSelect<ExtArgs> | null
    /**
     * Omit specific fields from the App
     */
    omit?: AppOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AppInclude<ExtArgs> | null
    /**
     * Filter, which App to fetch.
     */
    where?: AppWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Apps to fetch.
     */
    orderBy?: AppOrderByWithRelationInput | AppOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Apps.
     */
    cursor?: AppWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Apps from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Apps.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Apps.
     */
    distinct?: AppScalarFieldEnum | AppScalarFieldEnum[]
  }

  /**
   * App findFirstOrThrow
   */
  export type AppFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the App
     */
    select?: AppSelect<ExtArgs> | null
    /**
     * Omit specific fields from the App
     */
    omit?: AppOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AppInclude<ExtArgs> | null
    /**
     * Filter, which App to fetch.
     */
    where?: AppWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Apps to fetch.
     */
    orderBy?: AppOrderByWithRelationInput | AppOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Apps.
     */
    cursor?: AppWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Apps from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Apps.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Apps.
     */
    distinct?: AppScalarFieldEnum | AppScalarFieldEnum[]
  }

  /**
   * App findMany
   */
  export type AppFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the App
     */
    select?: AppSelect<ExtArgs> | null
    /**
     * Omit specific fields from the App
     */
    omit?: AppOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AppInclude<ExtArgs> | null
    /**
     * Filter, which Apps to fetch.
     */
    where?: AppWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Apps to fetch.
     */
    orderBy?: AppOrderByWithRelationInput | AppOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Apps.
     */
    cursor?: AppWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Apps from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Apps.
     */
    skip?: number
    distinct?: AppScalarFieldEnum | AppScalarFieldEnum[]
  }

  /**
   * App create
   */
  export type AppCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the App
     */
    select?: AppSelect<ExtArgs> | null
    /**
     * Omit specific fields from the App
     */
    omit?: AppOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AppInclude<ExtArgs> | null
    /**
     * The data needed to create a App.
     */
    data: XOR<AppCreateInput, AppUncheckedCreateInput>
  }

  /**
   * App createMany
   */
  export type AppCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Apps.
     */
    data: AppCreateManyInput | AppCreateManyInput[]
  }

  /**
   * App update
   */
  export type AppUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the App
     */
    select?: AppSelect<ExtArgs> | null
    /**
     * Omit specific fields from the App
     */
    omit?: AppOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AppInclude<ExtArgs> | null
    /**
     * The data needed to update a App.
     */
    data: XOR<AppUpdateInput, AppUncheckedUpdateInput>
    /**
     * Choose, which App to update.
     */
    where: AppWhereUniqueInput
  }

  /**
   * App updateMany
   */
  export type AppUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Apps.
     */
    data: XOR<AppUpdateManyMutationInput, AppUncheckedUpdateManyInput>
    /**
     * Filter which Apps to update
     */
    where?: AppWhereInput
    /**
     * Limit how many Apps to update.
     */
    limit?: number
  }

  /**
   * App upsert
   */
  export type AppUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the App
     */
    select?: AppSelect<ExtArgs> | null
    /**
     * Omit specific fields from the App
     */
    omit?: AppOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AppInclude<ExtArgs> | null
    /**
     * The filter to search for the App to update in case it exists.
     */
    where: AppWhereUniqueInput
    /**
     * In case the App found by the `where` argument doesn't exist, create a new App with this data.
     */
    create: XOR<AppCreateInput, AppUncheckedCreateInput>
    /**
     * In case the App was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AppUpdateInput, AppUncheckedUpdateInput>
  }

  /**
   * App delete
   */
  export type AppDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the App
     */
    select?: AppSelect<ExtArgs> | null
    /**
     * Omit specific fields from the App
     */
    omit?: AppOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AppInclude<ExtArgs> | null
    /**
     * Filter which App to delete.
     */
    where: AppWhereUniqueInput
  }

  /**
   * App deleteMany
   */
  export type AppDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Apps to delete
     */
    where?: AppWhereInput
    /**
     * Limit how many Apps to delete.
     */
    limit?: number
  }

  /**
   * App findRaw
   */
  export type AppFindRawArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The query predicate filter. If unspecified, then all documents in the collection will match the predicate. ${@link https://docs.mongodb.com/manual/reference/operator/query MongoDB Docs}.
     */
    filter?: InputJsonValue
    /**
     * Additional options to pass to the `find` command ${@link https://docs.mongodb.com/manual/reference/command/find/#command-fields MongoDB Docs}.
     */
    options?: InputJsonValue
  }

  /**
   * App aggregateRaw
   */
  export type AppAggregateRawArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * An array of aggregation stages to process and transform the document stream via the aggregation pipeline. ${@link https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline MongoDB Docs}.
     */
    pipeline?: InputJsonValue[]
    /**
     * Additional options to pass to the `aggregate` command ${@link https://docs.mongodb.com/manual/reference/command/aggregate/#command-fields MongoDB Docs}.
     */
    options?: InputJsonValue
  }

  /**
   * App.Capture
   */
  export type App$CaptureArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Capture
     */
    select?: CaptureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Capture
     */
    omit?: CaptureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CaptureInclude<ExtArgs> | null
    where?: CaptureWhereInput
    orderBy?: CaptureOrderByWithRelationInput | CaptureOrderByWithRelationInput[]
    cursor?: CaptureWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CaptureScalarFieldEnum | CaptureScalarFieldEnum[]
  }

  /**
   * App without action
   */
  export type AppDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the App
     */
    select?: AppSelect<ExtArgs> | null
    /**
     * Omit specific fields from the App
     */
    omit?: AppOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AppInclude<ExtArgs> | null
  }


  /**
   * Model Redaction
   */

  export type AggregateRedaction = {
    _count: RedactionCountAggregateOutputType | null
    _avg: RedactionAvgAggregateOutputType | null
    _sum: RedactionSumAggregateOutputType | null
    _min: RedactionMinAggregateOutputType | null
    _max: RedactionMaxAggregateOutputType | null
  }

  export type RedactionAvgAggregateOutputType = {
    v: number | null
  }

  export type RedactionSumAggregateOutputType = {
    v: number | null
  }

  export type RedactionMinAggregateOutputType = {
    id: string | null
    v: number | null
    label: string | null
    screen: string | null
  }

  export type RedactionMaxAggregateOutputType = {
    id: string | null
    v: number | null
    label: string | null
    screen: string | null
  }

  export type RedactionCountAggregateOutputType = {
    id: number
    v: number
    label: number
    screen: number
    _all: number
  }


  export type RedactionAvgAggregateInputType = {
    v?: true
  }

  export type RedactionSumAggregateInputType = {
    v?: true
  }

  export type RedactionMinAggregateInputType = {
    id?: true
    v?: true
    label?: true
    screen?: true
  }

  export type RedactionMaxAggregateInputType = {
    id?: true
    v?: true
    label?: true
    screen?: true
  }

  export type RedactionCountAggregateInputType = {
    id?: true
    v?: true
    label?: true
    screen?: true
    _all?: true
  }

  export type RedactionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Redaction to aggregate.
     */
    where?: RedactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Redactions to fetch.
     */
    orderBy?: RedactionOrderByWithRelationInput | RedactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: RedactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Redactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Redactions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Redactions
    **/
    _count?: true | RedactionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: RedactionAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: RedactionSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: RedactionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: RedactionMaxAggregateInputType
  }

  export type GetRedactionAggregateType<T extends RedactionAggregateArgs> = {
        [P in keyof T & keyof AggregateRedaction]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateRedaction[P]>
      : GetScalarType<T[P], AggregateRedaction[P]>
  }




  export type RedactionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RedactionWhereInput
    orderBy?: RedactionOrderByWithAggregationInput | RedactionOrderByWithAggregationInput[]
    by: RedactionScalarFieldEnum[] | RedactionScalarFieldEnum
    having?: RedactionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: RedactionCountAggregateInputType | true
    _avg?: RedactionAvgAggregateInputType
    _sum?: RedactionSumAggregateInputType
    _min?: RedactionMinAggregateInputType
    _max?: RedactionMaxAggregateInputType
  }

  export type RedactionGroupByOutputType = {
    id: string
    v: number
    label: string
    screen: string
    _count: RedactionCountAggregateOutputType | null
    _avg: RedactionAvgAggregateOutputType | null
    _sum: RedactionSumAggregateOutputType | null
    _min: RedactionMinAggregateOutputType | null
    _max: RedactionMaxAggregateOutputType | null
  }

  type GetRedactionGroupByPayload<T extends RedactionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<RedactionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof RedactionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], RedactionGroupByOutputType[P]>
            : GetScalarType<T[P], RedactionGroupByOutputType[P]>
        }
      >
    >


  export type RedactionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    v?: boolean
    label?: boolean
    screen?: boolean
  }, ExtArgs["result"]["redaction"]>



  export type RedactionSelectScalar = {
    id?: boolean
    v?: boolean
    label?: boolean
    screen?: boolean
  }

  export type RedactionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "v" | "label" | "screen", ExtArgs["result"]["redaction"]>

  export type $RedactionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Redaction"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      v: number
      label: string
      screen: string
    }, ExtArgs["result"]["redaction"]>
    composites: {}
  }

  type RedactionGetPayload<S extends boolean | null | undefined | RedactionDefaultArgs> = $Result.GetResult<Prisma.$RedactionPayload, S>

  type RedactionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<RedactionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: RedactionCountAggregateInputType | true
    }

  export interface RedactionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Redaction'], meta: { name: 'Redaction' } }
    /**
     * Find zero or one Redaction that matches the filter.
     * @param {RedactionFindUniqueArgs} args - Arguments to find a Redaction
     * @example
     * // Get one Redaction
     * const redaction = await prisma.redaction.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends RedactionFindUniqueArgs>(args: SelectSubset<T, RedactionFindUniqueArgs<ExtArgs>>): Prisma__RedactionClient<$Result.GetResult<Prisma.$RedactionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Redaction that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {RedactionFindUniqueOrThrowArgs} args - Arguments to find a Redaction
     * @example
     * // Get one Redaction
     * const redaction = await prisma.redaction.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends RedactionFindUniqueOrThrowArgs>(args: SelectSubset<T, RedactionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__RedactionClient<$Result.GetResult<Prisma.$RedactionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Redaction that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RedactionFindFirstArgs} args - Arguments to find a Redaction
     * @example
     * // Get one Redaction
     * const redaction = await prisma.redaction.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends RedactionFindFirstArgs>(args?: SelectSubset<T, RedactionFindFirstArgs<ExtArgs>>): Prisma__RedactionClient<$Result.GetResult<Prisma.$RedactionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Redaction that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RedactionFindFirstOrThrowArgs} args - Arguments to find a Redaction
     * @example
     * // Get one Redaction
     * const redaction = await prisma.redaction.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends RedactionFindFirstOrThrowArgs>(args?: SelectSubset<T, RedactionFindFirstOrThrowArgs<ExtArgs>>): Prisma__RedactionClient<$Result.GetResult<Prisma.$RedactionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Redactions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RedactionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Redactions
     * const redactions = await prisma.redaction.findMany()
     * 
     * // Get first 10 Redactions
     * const redactions = await prisma.redaction.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const redactionWithIdOnly = await prisma.redaction.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends RedactionFindManyArgs>(args?: SelectSubset<T, RedactionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RedactionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Redaction.
     * @param {RedactionCreateArgs} args - Arguments to create a Redaction.
     * @example
     * // Create one Redaction
     * const Redaction = await prisma.redaction.create({
     *   data: {
     *     // ... data to create a Redaction
     *   }
     * })
     * 
     */
    create<T extends RedactionCreateArgs>(args: SelectSubset<T, RedactionCreateArgs<ExtArgs>>): Prisma__RedactionClient<$Result.GetResult<Prisma.$RedactionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Redactions.
     * @param {RedactionCreateManyArgs} args - Arguments to create many Redactions.
     * @example
     * // Create many Redactions
     * const redaction = await prisma.redaction.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends RedactionCreateManyArgs>(args?: SelectSubset<T, RedactionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Redaction.
     * @param {RedactionDeleteArgs} args - Arguments to delete one Redaction.
     * @example
     * // Delete one Redaction
     * const Redaction = await prisma.redaction.delete({
     *   where: {
     *     // ... filter to delete one Redaction
     *   }
     * })
     * 
     */
    delete<T extends RedactionDeleteArgs>(args: SelectSubset<T, RedactionDeleteArgs<ExtArgs>>): Prisma__RedactionClient<$Result.GetResult<Prisma.$RedactionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Redaction.
     * @param {RedactionUpdateArgs} args - Arguments to update one Redaction.
     * @example
     * // Update one Redaction
     * const redaction = await prisma.redaction.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends RedactionUpdateArgs>(args: SelectSubset<T, RedactionUpdateArgs<ExtArgs>>): Prisma__RedactionClient<$Result.GetResult<Prisma.$RedactionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Redactions.
     * @param {RedactionDeleteManyArgs} args - Arguments to filter Redactions to delete.
     * @example
     * // Delete a few Redactions
     * const { count } = await prisma.redaction.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends RedactionDeleteManyArgs>(args?: SelectSubset<T, RedactionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Redactions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RedactionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Redactions
     * const redaction = await prisma.redaction.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends RedactionUpdateManyArgs>(args: SelectSubset<T, RedactionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Redaction.
     * @param {RedactionUpsertArgs} args - Arguments to update or create a Redaction.
     * @example
     * // Update or create a Redaction
     * const redaction = await prisma.redaction.upsert({
     *   create: {
     *     // ... data to create a Redaction
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Redaction we want to update
     *   }
     * })
     */
    upsert<T extends RedactionUpsertArgs>(args: SelectSubset<T, RedactionUpsertArgs<ExtArgs>>): Prisma__RedactionClient<$Result.GetResult<Prisma.$RedactionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Redactions that matches the filter.
     * @param {RedactionFindRawArgs} args - Select which filters you would like to apply.
     * @example
     * const redaction = await prisma.redaction.findRaw({
     *   filter: { age: { $gt: 25 } }
     * })
     */
    findRaw(args?: RedactionFindRawArgs): Prisma.PrismaPromise<JsonObject>

    /**
     * Perform aggregation operations on a Redaction.
     * @param {RedactionAggregateRawArgs} args - Select which aggregations you would like to apply.
     * @example
     * const redaction = await prisma.redaction.aggregateRaw({
     *   pipeline: [
     *     { $match: { status: "registered" } },
     *     { $group: { _id: "$country", total: { $sum: 1 } } }
     *   ]
     * })
     */
    aggregateRaw(args?: RedactionAggregateRawArgs): Prisma.PrismaPromise<JsonObject>


    /**
     * Count the number of Redactions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RedactionCountArgs} args - Arguments to filter Redactions to count.
     * @example
     * // Count the number of Redactions
     * const count = await prisma.redaction.count({
     *   where: {
     *     // ... the filter for the Redactions we want to count
     *   }
     * })
    **/
    count<T extends RedactionCountArgs>(
      args?: Subset<T, RedactionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], RedactionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Redaction.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RedactionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends RedactionAggregateArgs>(args: Subset<T, RedactionAggregateArgs>): Prisma.PrismaPromise<GetRedactionAggregateType<T>>

    /**
     * Group by Redaction.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RedactionGroupByArgs} args - Group by arguments.
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
      T extends RedactionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: RedactionGroupByArgs['orderBy'] }
        : { orderBy?: RedactionGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, RedactionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetRedactionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Redaction model
   */
  readonly fields: RedactionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Redaction.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__RedactionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
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
   * Fields of the Redaction model
   */
  interface RedactionFieldRefs {
    readonly id: FieldRef<"Redaction", 'String'>
    readonly v: FieldRef<"Redaction", 'Int'>
    readonly label: FieldRef<"Redaction", 'String'>
    readonly screen: FieldRef<"Redaction", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Redaction findUnique
   */
  export type RedactionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Redaction
     */
    select?: RedactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Redaction
     */
    omit?: RedactionOmit<ExtArgs> | null
    /**
     * Filter, which Redaction to fetch.
     */
    where: RedactionWhereUniqueInput
  }

  /**
   * Redaction findUniqueOrThrow
   */
  export type RedactionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Redaction
     */
    select?: RedactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Redaction
     */
    omit?: RedactionOmit<ExtArgs> | null
    /**
     * Filter, which Redaction to fetch.
     */
    where: RedactionWhereUniqueInput
  }

  /**
   * Redaction findFirst
   */
  export type RedactionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Redaction
     */
    select?: RedactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Redaction
     */
    omit?: RedactionOmit<ExtArgs> | null
    /**
     * Filter, which Redaction to fetch.
     */
    where?: RedactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Redactions to fetch.
     */
    orderBy?: RedactionOrderByWithRelationInput | RedactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Redactions.
     */
    cursor?: RedactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Redactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Redactions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Redactions.
     */
    distinct?: RedactionScalarFieldEnum | RedactionScalarFieldEnum[]
  }

  /**
   * Redaction findFirstOrThrow
   */
  export type RedactionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Redaction
     */
    select?: RedactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Redaction
     */
    omit?: RedactionOmit<ExtArgs> | null
    /**
     * Filter, which Redaction to fetch.
     */
    where?: RedactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Redactions to fetch.
     */
    orderBy?: RedactionOrderByWithRelationInput | RedactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Redactions.
     */
    cursor?: RedactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Redactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Redactions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Redactions.
     */
    distinct?: RedactionScalarFieldEnum | RedactionScalarFieldEnum[]
  }

  /**
   * Redaction findMany
   */
  export type RedactionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Redaction
     */
    select?: RedactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Redaction
     */
    omit?: RedactionOmit<ExtArgs> | null
    /**
     * Filter, which Redactions to fetch.
     */
    where?: RedactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Redactions to fetch.
     */
    orderBy?: RedactionOrderByWithRelationInput | RedactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Redactions.
     */
    cursor?: RedactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Redactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Redactions.
     */
    skip?: number
    distinct?: RedactionScalarFieldEnum | RedactionScalarFieldEnum[]
  }

  /**
   * Redaction create
   */
  export type RedactionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Redaction
     */
    select?: RedactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Redaction
     */
    omit?: RedactionOmit<ExtArgs> | null
    /**
     * The data needed to create a Redaction.
     */
    data: XOR<RedactionCreateInput, RedactionUncheckedCreateInput>
  }

  /**
   * Redaction createMany
   */
  export type RedactionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Redactions.
     */
    data: RedactionCreateManyInput | RedactionCreateManyInput[]
  }

  /**
   * Redaction update
   */
  export type RedactionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Redaction
     */
    select?: RedactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Redaction
     */
    omit?: RedactionOmit<ExtArgs> | null
    /**
     * The data needed to update a Redaction.
     */
    data: XOR<RedactionUpdateInput, RedactionUncheckedUpdateInput>
    /**
     * Choose, which Redaction to update.
     */
    where: RedactionWhereUniqueInput
  }

  /**
   * Redaction updateMany
   */
  export type RedactionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Redactions.
     */
    data: XOR<RedactionUpdateManyMutationInput, RedactionUncheckedUpdateManyInput>
    /**
     * Filter which Redactions to update
     */
    where?: RedactionWhereInput
    /**
     * Limit how many Redactions to update.
     */
    limit?: number
  }

  /**
   * Redaction upsert
   */
  export type RedactionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Redaction
     */
    select?: RedactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Redaction
     */
    omit?: RedactionOmit<ExtArgs> | null
    /**
     * The filter to search for the Redaction to update in case it exists.
     */
    where: RedactionWhereUniqueInput
    /**
     * In case the Redaction found by the `where` argument doesn't exist, create a new Redaction with this data.
     */
    create: XOR<RedactionCreateInput, RedactionUncheckedCreateInput>
    /**
     * In case the Redaction was found with the provided `where` argument, update it with this data.
     */
    update: XOR<RedactionUpdateInput, RedactionUncheckedUpdateInput>
  }

  /**
   * Redaction delete
   */
  export type RedactionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Redaction
     */
    select?: RedactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Redaction
     */
    omit?: RedactionOmit<ExtArgs> | null
    /**
     * Filter which Redaction to delete.
     */
    where: RedactionWhereUniqueInput
  }

  /**
   * Redaction deleteMany
   */
  export type RedactionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Redactions to delete
     */
    where?: RedactionWhereInput
    /**
     * Limit how many Redactions to delete.
     */
    limit?: number
  }

  /**
   * Redaction findRaw
   */
  export type RedactionFindRawArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The query predicate filter. If unspecified, then all documents in the collection will match the predicate. ${@link https://docs.mongodb.com/manual/reference/operator/query MongoDB Docs}.
     */
    filter?: InputJsonValue
    /**
     * Additional options to pass to the `find` command ${@link https://docs.mongodb.com/manual/reference/command/find/#command-fields MongoDB Docs}.
     */
    options?: InputJsonValue
  }

  /**
   * Redaction aggregateRaw
   */
  export type RedactionAggregateRawArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * An array of aggregation stages to process and transform the document stream via the aggregation pipeline. ${@link https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline MongoDB Docs}.
     */
    pipeline?: InputJsonValue[]
    /**
     * Additional options to pass to the `aggregate` command ${@link https://docs.mongodb.com/manual/reference/command/aggregate/#command-fields MongoDB Docs}.
     */
    options?: InputJsonValue
  }

  /**
   * Redaction without action
   */
  export type RedactionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Redaction
     */
    select?: RedactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Redaction
     */
    omit?: RedactionOmit<ExtArgs> | null
  }


  /**
   * Model Screen
   */

  export type AggregateScreen = {
    _count: ScreenCountAggregateOutputType | null
    _avg: ScreenAvgAggregateOutputType | null
    _sum: ScreenSumAggregateOutputType | null
    _min: ScreenMinAggregateOutputType | null
    _max: ScreenMaxAggregateOutputType | null
  }

  export type ScreenAvgAggregateOutputType = {
    v: number | null
  }

  export type ScreenSumAggregateOutputType = {
    v: number | null
  }

  export type ScreenMinAggregateOutputType = {
    id: string | null
    v: number | null
    created: Date | null
    src: string | null
    vh: string | null
    traceId: string | null
  }

  export type ScreenMaxAggregateOutputType = {
    id: string | null
    v: number | null
    created: Date | null
    src: string | null
    vh: string | null
    traceId: string | null
  }

  export type ScreenCountAggregateOutputType = {
    id: number
    v: number
    created: number
    src: number
    vh: number
    traceId: number
    _all: number
  }


  export type ScreenAvgAggregateInputType = {
    v?: true
  }

  export type ScreenSumAggregateInputType = {
    v?: true
  }

  export type ScreenMinAggregateInputType = {
    id?: true
    v?: true
    created?: true
    src?: true
    vh?: true
    traceId?: true
  }

  export type ScreenMaxAggregateInputType = {
    id?: true
    v?: true
    created?: true
    src?: true
    vh?: true
    traceId?: true
  }

  export type ScreenCountAggregateInputType = {
    id?: true
    v?: true
    created?: true
    src?: true
    vh?: true
    traceId?: true
    _all?: true
  }

  export type ScreenAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Screen to aggregate.
     */
    where?: ScreenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Screens to fetch.
     */
    orderBy?: ScreenOrderByWithRelationInput | ScreenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ScreenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Screens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Screens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Screens
    **/
    _count?: true | ScreenCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ScreenAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ScreenSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ScreenMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ScreenMaxAggregateInputType
  }

  export type GetScreenAggregateType<T extends ScreenAggregateArgs> = {
        [P in keyof T & keyof AggregateScreen]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateScreen[P]>
      : GetScalarType<T[P], AggregateScreen[P]>
  }




  export type ScreenGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ScreenWhereInput
    orderBy?: ScreenOrderByWithAggregationInput | ScreenOrderByWithAggregationInput[]
    by: ScreenScalarFieldEnum[] | ScreenScalarFieldEnum
    having?: ScreenScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ScreenCountAggregateInputType | true
    _avg?: ScreenAvgAggregateInputType
    _sum?: ScreenSumAggregateInputType
    _min?: ScreenMinAggregateInputType
    _max?: ScreenMaxAggregateInputType
  }

  export type ScreenGroupByOutputType = {
    id: string
    v: number
    created: Date
    src: string
    vh: string
    traceId: string
    _count: ScreenCountAggregateOutputType | null
    _avg: ScreenAvgAggregateOutputType | null
    _sum: ScreenSumAggregateOutputType | null
    _min: ScreenMinAggregateOutputType | null
    _max: ScreenMaxAggregateOutputType | null
  }

  type GetScreenGroupByPayload<T extends ScreenGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ScreenGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ScreenGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ScreenGroupByOutputType[P]>
            : GetScalarType<T[P], ScreenGroupByOutputType[P]>
        }
      >
    >


  export type ScreenSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    v?: boolean
    created?: boolean
    gesture?: boolean | ScreenGestureDefaultArgs<ExtArgs>
    src?: boolean
    vh?: boolean
    traceId?: boolean
    trace?: boolean | TraceDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["screen"]>



  export type ScreenSelectScalar = {
    id?: boolean
    v?: boolean
    created?: boolean
    src?: boolean
    vh?: boolean
    traceId?: boolean
  }

  export type ScreenOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "v" | "created" | "gesture" | "src" | "vh" | "traceId", ExtArgs["result"]["screen"]>
  export type ScreenInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    trace?: boolean | TraceDefaultArgs<ExtArgs>
  }

  export type $ScreenPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Screen"
    objects: {
      trace: Prisma.$TracePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      v: number
      created: Date
      src: string
      vh: string
      traceId: string
    }, ExtArgs["result"]["screen"]>
    composites: {
      gesture: Prisma.$ScreenGesturePayload
    }
  }

  type ScreenGetPayload<S extends boolean | null | undefined | ScreenDefaultArgs> = $Result.GetResult<Prisma.$ScreenPayload, S>

  type ScreenCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ScreenFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ScreenCountAggregateInputType | true
    }

  export interface ScreenDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Screen'], meta: { name: 'Screen' } }
    /**
     * Find zero or one Screen that matches the filter.
     * @param {ScreenFindUniqueArgs} args - Arguments to find a Screen
     * @example
     * // Get one Screen
     * const screen = await prisma.screen.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ScreenFindUniqueArgs>(args: SelectSubset<T, ScreenFindUniqueArgs<ExtArgs>>): Prisma__ScreenClient<$Result.GetResult<Prisma.$ScreenPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Screen that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ScreenFindUniqueOrThrowArgs} args - Arguments to find a Screen
     * @example
     * // Get one Screen
     * const screen = await prisma.screen.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ScreenFindUniqueOrThrowArgs>(args: SelectSubset<T, ScreenFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ScreenClient<$Result.GetResult<Prisma.$ScreenPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Screen that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ScreenFindFirstArgs} args - Arguments to find a Screen
     * @example
     * // Get one Screen
     * const screen = await prisma.screen.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ScreenFindFirstArgs>(args?: SelectSubset<T, ScreenFindFirstArgs<ExtArgs>>): Prisma__ScreenClient<$Result.GetResult<Prisma.$ScreenPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Screen that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ScreenFindFirstOrThrowArgs} args - Arguments to find a Screen
     * @example
     * // Get one Screen
     * const screen = await prisma.screen.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ScreenFindFirstOrThrowArgs>(args?: SelectSubset<T, ScreenFindFirstOrThrowArgs<ExtArgs>>): Prisma__ScreenClient<$Result.GetResult<Prisma.$ScreenPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Screens that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ScreenFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Screens
     * const screens = await prisma.screen.findMany()
     * 
     * // Get first 10 Screens
     * const screens = await prisma.screen.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const screenWithIdOnly = await prisma.screen.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ScreenFindManyArgs>(args?: SelectSubset<T, ScreenFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ScreenPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Screen.
     * @param {ScreenCreateArgs} args - Arguments to create a Screen.
     * @example
     * // Create one Screen
     * const Screen = await prisma.screen.create({
     *   data: {
     *     // ... data to create a Screen
     *   }
     * })
     * 
     */
    create<T extends ScreenCreateArgs>(args: SelectSubset<T, ScreenCreateArgs<ExtArgs>>): Prisma__ScreenClient<$Result.GetResult<Prisma.$ScreenPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Screens.
     * @param {ScreenCreateManyArgs} args - Arguments to create many Screens.
     * @example
     * // Create many Screens
     * const screen = await prisma.screen.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ScreenCreateManyArgs>(args?: SelectSubset<T, ScreenCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Screen.
     * @param {ScreenDeleteArgs} args - Arguments to delete one Screen.
     * @example
     * // Delete one Screen
     * const Screen = await prisma.screen.delete({
     *   where: {
     *     // ... filter to delete one Screen
     *   }
     * })
     * 
     */
    delete<T extends ScreenDeleteArgs>(args: SelectSubset<T, ScreenDeleteArgs<ExtArgs>>): Prisma__ScreenClient<$Result.GetResult<Prisma.$ScreenPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Screen.
     * @param {ScreenUpdateArgs} args - Arguments to update one Screen.
     * @example
     * // Update one Screen
     * const screen = await prisma.screen.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ScreenUpdateArgs>(args: SelectSubset<T, ScreenUpdateArgs<ExtArgs>>): Prisma__ScreenClient<$Result.GetResult<Prisma.$ScreenPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Screens.
     * @param {ScreenDeleteManyArgs} args - Arguments to filter Screens to delete.
     * @example
     * // Delete a few Screens
     * const { count } = await prisma.screen.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ScreenDeleteManyArgs>(args?: SelectSubset<T, ScreenDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Screens.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ScreenUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Screens
     * const screen = await prisma.screen.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ScreenUpdateManyArgs>(args: SelectSubset<T, ScreenUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Screen.
     * @param {ScreenUpsertArgs} args - Arguments to update or create a Screen.
     * @example
     * // Update or create a Screen
     * const screen = await prisma.screen.upsert({
     *   create: {
     *     // ... data to create a Screen
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Screen we want to update
     *   }
     * })
     */
    upsert<T extends ScreenUpsertArgs>(args: SelectSubset<T, ScreenUpsertArgs<ExtArgs>>): Prisma__ScreenClient<$Result.GetResult<Prisma.$ScreenPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Screens that matches the filter.
     * @param {ScreenFindRawArgs} args - Select which filters you would like to apply.
     * @example
     * const screen = await prisma.screen.findRaw({
     *   filter: { age: { $gt: 25 } }
     * })
     */
    findRaw(args?: ScreenFindRawArgs): Prisma.PrismaPromise<JsonObject>

    /**
     * Perform aggregation operations on a Screen.
     * @param {ScreenAggregateRawArgs} args - Select which aggregations you would like to apply.
     * @example
     * const screen = await prisma.screen.aggregateRaw({
     *   pipeline: [
     *     { $match: { status: "registered" } },
     *     { $group: { _id: "$country", total: { $sum: 1 } } }
     *   ]
     * })
     */
    aggregateRaw(args?: ScreenAggregateRawArgs): Prisma.PrismaPromise<JsonObject>


    /**
     * Count the number of Screens.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ScreenCountArgs} args - Arguments to filter Screens to count.
     * @example
     * // Count the number of Screens
     * const count = await prisma.screen.count({
     *   where: {
     *     // ... the filter for the Screens we want to count
     *   }
     * })
    **/
    count<T extends ScreenCountArgs>(
      args?: Subset<T, ScreenCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ScreenCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Screen.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ScreenAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends ScreenAggregateArgs>(args: Subset<T, ScreenAggregateArgs>): Prisma.PrismaPromise<GetScreenAggregateType<T>>

    /**
     * Group by Screen.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ScreenGroupByArgs} args - Group by arguments.
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
      T extends ScreenGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ScreenGroupByArgs['orderBy'] }
        : { orderBy?: ScreenGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, ScreenGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetScreenGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Screen model
   */
  readonly fields: ScreenFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Screen.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ScreenClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    trace<T extends TraceDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TraceDefaultArgs<ExtArgs>>): Prisma__TraceClient<$Result.GetResult<Prisma.$TracePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
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
   * Fields of the Screen model
   */
  interface ScreenFieldRefs {
    readonly id: FieldRef<"Screen", 'String'>
    readonly v: FieldRef<"Screen", 'Int'>
    readonly created: FieldRef<"Screen", 'DateTime'>
    readonly src: FieldRef<"Screen", 'String'>
    readonly vh: FieldRef<"Screen", 'String'>
    readonly traceId: FieldRef<"Screen", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Screen findUnique
   */
  export type ScreenFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Screen
     */
    select?: ScreenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Screen
     */
    omit?: ScreenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScreenInclude<ExtArgs> | null
    /**
     * Filter, which Screen to fetch.
     */
    where: ScreenWhereUniqueInput
  }

  /**
   * Screen findUniqueOrThrow
   */
  export type ScreenFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Screen
     */
    select?: ScreenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Screen
     */
    omit?: ScreenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScreenInclude<ExtArgs> | null
    /**
     * Filter, which Screen to fetch.
     */
    where: ScreenWhereUniqueInput
  }

  /**
   * Screen findFirst
   */
  export type ScreenFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Screen
     */
    select?: ScreenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Screen
     */
    omit?: ScreenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScreenInclude<ExtArgs> | null
    /**
     * Filter, which Screen to fetch.
     */
    where?: ScreenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Screens to fetch.
     */
    orderBy?: ScreenOrderByWithRelationInput | ScreenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Screens.
     */
    cursor?: ScreenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Screens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Screens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Screens.
     */
    distinct?: ScreenScalarFieldEnum | ScreenScalarFieldEnum[]
  }

  /**
   * Screen findFirstOrThrow
   */
  export type ScreenFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Screen
     */
    select?: ScreenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Screen
     */
    omit?: ScreenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScreenInclude<ExtArgs> | null
    /**
     * Filter, which Screen to fetch.
     */
    where?: ScreenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Screens to fetch.
     */
    orderBy?: ScreenOrderByWithRelationInput | ScreenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Screens.
     */
    cursor?: ScreenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Screens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Screens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Screens.
     */
    distinct?: ScreenScalarFieldEnum | ScreenScalarFieldEnum[]
  }

  /**
   * Screen findMany
   */
  export type ScreenFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Screen
     */
    select?: ScreenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Screen
     */
    omit?: ScreenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScreenInclude<ExtArgs> | null
    /**
     * Filter, which Screens to fetch.
     */
    where?: ScreenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Screens to fetch.
     */
    orderBy?: ScreenOrderByWithRelationInput | ScreenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Screens.
     */
    cursor?: ScreenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Screens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Screens.
     */
    skip?: number
    distinct?: ScreenScalarFieldEnum | ScreenScalarFieldEnum[]
  }

  /**
   * Screen create
   */
  export type ScreenCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Screen
     */
    select?: ScreenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Screen
     */
    omit?: ScreenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScreenInclude<ExtArgs> | null
    /**
     * The data needed to create a Screen.
     */
    data: XOR<ScreenCreateInput, ScreenUncheckedCreateInput>
  }

  /**
   * Screen createMany
   */
  export type ScreenCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Screens.
     */
    data: ScreenCreateManyInput | ScreenCreateManyInput[]
  }

  /**
   * Screen update
   */
  export type ScreenUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Screen
     */
    select?: ScreenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Screen
     */
    omit?: ScreenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScreenInclude<ExtArgs> | null
    /**
     * The data needed to update a Screen.
     */
    data: XOR<ScreenUpdateInput, ScreenUncheckedUpdateInput>
    /**
     * Choose, which Screen to update.
     */
    where: ScreenWhereUniqueInput
  }

  /**
   * Screen updateMany
   */
  export type ScreenUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Screens.
     */
    data: XOR<ScreenUpdateManyMutationInput, ScreenUncheckedUpdateManyInput>
    /**
     * Filter which Screens to update
     */
    where?: ScreenWhereInput
    /**
     * Limit how many Screens to update.
     */
    limit?: number
  }

  /**
   * Screen upsert
   */
  export type ScreenUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Screen
     */
    select?: ScreenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Screen
     */
    omit?: ScreenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScreenInclude<ExtArgs> | null
    /**
     * The filter to search for the Screen to update in case it exists.
     */
    where: ScreenWhereUniqueInput
    /**
     * In case the Screen found by the `where` argument doesn't exist, create a new Screen with this data.
     */
    create: XOR<ScreenCreateInput, ScreenUncheckedCreateInput>
    /**
     * In case the Screen was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ScreenUpdateInput, ScreenUncheckedUpdateInput>
  }

  /**
   * Screen delete
   */
  export type ScreenDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Screen
     */
    select?: ScreenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Screen
     */
    omit?: ScreenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScreenInclude<ExtArgs> | null
    /**
     * Filter which Screen to delete.
     */
    where: ScreenWhereUniqueInput
  }

  /**
   * Screen deleteMany
   */
  export type ScreenDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Screens to delete
     */
    where?: ScreenWhereInput
    /**
     * Limit how many Screens to delete.
     */
    limit?: number
  }

  /**
   * Screen findRaw
   */
  export type ScreenFindRawArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The query predicate filter. If unspecified, then all documents in the collection will match the predicate. ${@link https://docs.mongodb.com/manual/reference/operator/query MongoDB Docs}.
     */
    filter?: InputJsonValue
    /**
     * Additional options to pass to the `find` command ${@link https://docs.mongodb.com/manual/reference/command/find/#command-fields MongoDB Docs}.
     */
    options?: InputJsonValue
  }

  /**
   * Screen aggregateRaw
   */
  export type ScreenAggregateRawArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * An array of aggregation stages to process and transform the document stream via the aggregation pipeline. ${@link https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline MongoDB Docs}.
     */
    pipeline?: InputJsonValue[]
    /**
     * Additional options to pass to the `aggregate` command ${@link https://docs.mongodb.com/manual/reference/command/aggregate/#command-fields MongoDB Docs}.
     */
    options?: InputJsonValue
  }

  /**
   * Screen without action
   */
  export type ScreenDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Screen
     */
    select?: ScreenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Screen
     */
    omit?: ScreenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScreenInclude<ExtArgs> | null
  }


  /**
   * Model Trace
   */

  export type AggregateTrace = {
    _count: TraceCountAggregateOutputType | null
    _avg: TraceAvgAggregateOutputType | null
    _sum: TraceSumAggregateOutputType | null
    _min: TraceMinAggregateOutputType | null
    _max: TraceMaxAggregateOutputType | null
  }

  export type TraceAvgAggregateOutputType = {
    v: number | null
  }

  export type TraceSumAggregateOutputType = {
    v: number | null
  }

  export type TraceMinAggregateOutputType = {
    id: string | null
    v: number | null
    appId: string | null
    created: Date | null
    name: string | null
    description: string | null
    taskId: string | null
    worker: string | null
  }

  export type TraceMaxAggregateOutputType = {
    id: string | null
    v: number | null
    appId: string | null
    created: Date | null
    name: string | null
    description: string | null
    taskId: string | null
    worker: string | null
  }

  export type TraceCountAggregateOutputType = {
    id: number
    v: number
    appId: number
    created: number
    name: number
    description: number
    screenIds: number
    taskId: number
    worker: number
    _all: number
  }


  export type TraceAvgAggregateInputType = {
    v?: true
  }

  export type TraceSumAggregateInputType = {
    v?: true
  }

  export type TraceMinAggregateInputType = {
    id?: true
    v?: true
    appId?: true
    created?: true
    name?: true
    description?: true
    taskId?: true
    worker?: true
  }

  export type TraceMaxAggregateInputType = {
    id?: true
    v?: true
    appId?: true
    created?: true
    name?: true
    description?: true
    taskId?: true
    worker?: true
  }

  export type TraceCountAggregateInputType = {
    id?: true
    v?: true
    appId?: true
    created?: true
    name?: true
    description?: true
    screenIds?: true
    taskId?: true
    worker?: true
    _all?: true
  }

  export type TraceAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Trace to aggregate.
     */
    where?: TraceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Traces to fetch.
     */
    orderBy?: TraceOrderByWithRelationInput | TraceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TraceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Traces from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Traces.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Traces
    **/
    _count?: true | TraceCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TraceAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TraceSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TraceMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TraceMaxAggregateInputType
  }

  export type GetTraceAggregateType<T extends TraceAggregateArgs> = {
        [P in keyof T & keyof AggregateTrace]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTrace[P]>
      : GetScalarType<T[P], AggregateTrace[P]>
  }




  export type TraceGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TraceWhereInput
    orderBy?: TraceOrderByWithAggregationInput | TraceOrderByWithAggregationInput[]
    by: TraceScalarFieldEnum[] | TraceScalarFieldEnum
    having?: TraceScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TraceCountAggregateInputType | true
    _avg?: TraceAvgAggregateInputType
    _sum?: TraceSumAggregateInputType
    _min?: TraceMinAggregateInputType
    _max?: TraceMaxAggregateInputType
  }

  export type TraceGroupByOutputType = {
    id: string
    v: number
    appId: string
    created: Date
    name: string | null
    description: string
    screenIds: string[]
    taskId: string | null
    worker: string
    _count: TraceCountAggregateOutputType | null
    _avg: TraceAvgAggregateOutputType | null
    _sum: TraceSumAggregateOutputType | null
    _min: TraceMinAggregateOutputType | null
    _max: TraceMaxAggregateOutputType | null
  }

  type GetTraceGroupByPayload<T extends TraceGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TraceGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TraceGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TraceGroupByOutputType[P]>
            : GetScalarType<T[P], TraceGroupByOutputType[P]>
        }
      >
    >


  export type TraceSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    v?: boolean
    appId?: boolean
    created?: boolean
    name?: boolean
    description?: boolean
    screenIds?: boolean
    taskId?: boolean
    worker?: boolean
    screens?: boolean | Trace$screensArgs<ExtArgs>
    task?: boolean | Trace$taskArgs<ExtArgs>
    _count?: boolean | TraceCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["trace"]>



  export type TraceSelectScalar = {
    id?: boolean
    v?: boolean
    appId?: boolean
    created?: boolean
    name?: boolean
    description?: boolean
    screenIds?: boolean
    taskId?: boolean
    worker?: boolean
  }

  export type TraceOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "v" | "appId" | "created" | "name" | "description" | "screenIds" | "taskId" | "worker", ExtArgs["result"]["trace"]>
  export type TraceInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    screens?: boolean | Trace$screensArgs<ExtArgs>
    task?: boolean | Trace$taskArgs<ExtArgs>
    _count?: boolean | TraceCountOutputTypeDefaultArgs<ExtArgs>
  }

  export type $TracePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Trace"
    objects: {
      screens: Prisma.$ScreenPayload<ExtArgs>[]
      task: Prisma.$TaskPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      v: number
      appId: string
      created: Date
      name: string | null
      description: string
      screenIds: string[]
      taskId: string | null
      worker: string
    }, ExtArgs["result"]["trace"]>
    composites: {}
  }

  type TraceGetPayload<S extends boolean | null | undefined | TraceDefaultArgs> = $Result.GetResult<Prisma.$TracePayload, S>

  type TraceCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TraceFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TraceCountAggregateInputType | true
    }

  export interface TraceDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Trace'], meta: { name: 'Trace' } }
    /**
     * Find zero or one Trace that matches the filter.
     * @param {TraceFindUniqueArgs} args - Arguments to find a Trace
     * @example
     * // Get one Trace
     * const trace = await prisma.trace.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TraceFindUniqueArgs>(args: SelectSubset<T, TraceFindUniqueArgs<ExtArgs>>): Prisma__TraceClient<$Result.GetResult<Prisma.$TracePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Trace that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TraceFindUniqueOrThrowArgs} args - Arguments to find a Trace
     * @example
     * // Get one Trace
     * const trace = await prisma.trace.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TraceFindUniqueOrThrowArgs>(args: SelectSubset<T, TraceFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TraceClient<$Result.GetResult<Prisma.$TracePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Trace that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TraceFindFirstArgs} args - Arguments to find a Trace
     * @example
     * // Get one Trace
     * const trace = await prisma.trace.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TraceFindFirstArgs>(args?: SelectSubset<T, TraceFindFirstArgs<ExtArgs>>): Prisma__TraceClient<$Result.GetResult<Prisma.$TracePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Trace that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TraceFindFirstOrThrowArgs} args - Arguments to find a Trace
     * @example
     * // Get one Trace
     * const trace = await prisma.trace.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TraceFindFirstOrThrowArgs>(args?: SelectSubset<T, TraceFindFirstOrThrowArgs<ExtArgs>>): Prisma__TraceClient<$Result.GetResult<Prisma.$TracePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Traces that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TraceFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Traces
     * const traces = await prisma.trace.findMany()
     * 
     * // Get first 10 Traces
     * const traces = await prisma.trace.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const traceWithIdOnly = await prisma.trace.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TraceFindManyArgs>(args?: SelectSubset<T, TraceFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TracePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Trace.
     * @param {TraceCreateArgs} args - Arguments to create a Trace.
     * @example
     * // Create one Trace
     * const Trace = await prisma.trace.create({
     *   data: {
     *     // ... data to create a Trace
     *   }
     * })
     * 
     */
    create<T extends TraceCreateArgs>(args: SelectSubset<T, TraceCreateArgs<ExtArgs>>): Prisma__TraceClient<$Result.GetResult<Prisma.$TracePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Traces.
     * @param {TraceCreateManyArgs} args - Arguments to create many Traces.
     * @example
     * // Create many Traces
     * const trace = await prisma.trace.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TraceCreateManyArgs>(args?: SelectSubset<T, TraceCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Trace.
     * @param {TraceDeleteArgs} args - Arguments to delete one Trace.
     * @example
     * // Delete one Trace
     * const Trace = await prisma.trace.delete({
     *   where: {
     *     // ... filter to delete one Trace
     *   }
     * })
     * 
     */
    delete<T extends TraceDeleteArgs>(args: SelectSubset<T, TraceDeleteArgs<ExtArgs>>): Prisma__TraceClient<$Result.GetResult<Prisma.$TracePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Trace.
     * @param {TraceUpdateArgs} args - Arguments to update one Trace.
     * @example
     * // Update one Trace
     * const trace = await prisma.trace.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TraceUpdateArgs>(args: SelectSubset<T, TraceUpdateArgs<ExtArgs>>): Prisma__TraceClient<$Result.GetResult<Prisma.$TracePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Traces.
     * @param {TraceDeleteManyArgs} args - Arguments to filter Traces to delete.
     * @example
     * // Delete a few Traces
     * const { count } = await prisma.trace.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TraceDeleteManyArgs>(args?: SelectSubset<T, TraceDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Traces.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TraceUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Traces
     * const trace = await prisma.trace.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TraceUpdateManyArgs>(args: SelectSubset<T, TraceUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Trace.
     * @param {TraceUpsertArgs} args - Arguments to update or create a Trace.
     * @example
     * // Update or create a Trace
     * const trace = await prisma.trace.upsert({
     *   create: {
     *     // ... data to create a Trace
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Trace we want to update
     *   }
     * })
     */
    upsert<T extends TraceUpsertArgs>(args: SelectSubset<T, TraceUpsertArgs<ExtArgs>>): Prisma__TraceClient<$Result.GetResult<Prisma.$TracePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Traces that matches the filter.
     * @param {TraceFindRawArgs} args - Select which filters you would like to apply.
     * @example
     * const trace = await prisma.trace.findRaw({
     *   filter: { age: { $gt: 25 } }
     * })
     */
    findRaw(args?: TraceFindRawArgs): Prisma.PrismaPromise<JsonObject>

    /**
     * Perform aggregation operations on a Trace.
     * @param {TraceAggregateRawArgs} args - Select which aggregations you would like to apply.
     * @example
     * const trace = await prisma.trace.aggregateRaw({
     *   pipeline: [
     *     { $match: { status: "registered" } },
     *     { $group: { _id: "$country", total: { $sum: 1 } } }
     *   ]
     * })
     */
    aggregateRaw(args?: TraceAggregateRawArgs): Prisma.PrismaPromise<JsonObject>


    /**
     * Count the number of Traces.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TraceCountArgs} args - Arguments to filter Traces to count.
     * @example
     * // Count the number of Traces
     * const count = await prisma.trace.count({
     *   where: {
     *     // ... the filter for the Traces we want to count
     *   }
     * })
    **/
    count<T extends TraceCountArgs>(
      args?: Subset<T, TraceCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TraceCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Trace.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TraceAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends TraceAggregateArgs>(args: Subset<T, TraceAggregateArgs>): Prisma.PrismaPromise<GetTraceAggregateType<T>>

    /**
     * Group by Trace.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TraceGroupByArgs} args - Group by arguments.
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
      T extends TraceGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TraceGroupByArgs['orderBy'] }
        : { orderBy?: TraceGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, TraceGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTraceGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Trace model
   */
  readonly fields: TraceFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Trace.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TraceClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    screens<T extends Trace$screensArgs<ExtArgs> = {}>(args?: Subset<T, Trace$screensArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ScreenPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    task<T extends Trace$taskArgs<ExtArgs> = {}>(args?: Subset<T, Trace$taskArgs<ExtArgs>>): Prisma__TaskClient<$Result.GetResult<Prisma.$TaskPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
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
   * Fields of the Trace model
   */
  interface TraceFieldRefs {
    readonly id: FieldRef<"Trace", 'String'>
    readonly v: FieldRef<"Trace", 'Int'>
    readonly appId: FieldRef<"Trace", 'String'>
    readonly created: FieldRef<"Trace", 'DateTime'>
    readonly name: FieldRef<"Trace", 'String'>
    readonly description: FieldRef<"Trace", 'String'>
    readonly screenIds: FieldRef<"Trace", 'String[]'>
    readonly taskId: FieldRef<"Trace", 'String'>
    readonly worker: FieldRef<"Trace", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Trace findUnique
   */
  export type TraceFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Trace
     */
    select?: TraceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Trace
     */
    omit?: TraceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TraceInclude<ExtArgs> | null
    /**
     * Filter, which Trace to fetch.
     */
    where: TraceWhereUniqueInput
  }

  /**
   * Trace findUniqueOrThrow
   */
  export type TraceFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Trace
     */
    select?: TraceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Trace
     */
    omit?: TraceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TraceInclude<ExtArgs> | null
    /**
     * Filter, which Trace to fetch.
     */
    where: TraceWhereUniqueInput
  }

  /**
   * Trace findFirst
   */
  export type TraceFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Trace
     */
    select?: TraceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Trace
     */
    omit?: TraceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TraceInclude<ExtArgs> | null
    /**
     * Filter, which Trace to fetch.
     */
    where?: TraceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Traces to fetch.
     */
    orderBy?: TraceOrderByWithRelationInput | TraceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Traces.
     */
    cursor?: TraceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Traces from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Traces.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Traces.
     */
    distinct?: TraceScalarFieldEnum | TraceScalarFieldEnum[]
  }

  /**
   * Trace findFirstOrThrow
   */
  export type TraceFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Trace
     */
    select?: TraceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Trace
     */
    omit?: TraceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TraceInclude<ExtArgs> | null
    /**
     * Filter, which Trace to fetch.
     */
    where?: TraceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Traces to fetch.
     */
    orderBy?: TraceOrderByWithRelationInput | TraceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Traces.
     */
    cursor?: TraceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Traces from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Traces.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Traces.
     */
    distinct?: TraceScalarFieldEnum | TraceScalarFieldEnum[]
  }

  /**
   * Trace findMany
   */
  export type TraceFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Trace
     */
    select?: TraceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Trace
     */
    omit?: TraceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TraceInclude<ExtArgs> | null
    /**
     * Filter, which Traces to fetch.
     */
    where?: TraceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Traces to fetch.
     */
    orderBy?: TraceOrderByWithRelationInput | TraceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Traces.
     */
    cursor?: TraceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Traces from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Traces.
     */
    skip?: number
    distinct?: TraceScalarFieldEnum | TraceScalarFieldEnum[]
  }

  /**
   * Trace create
   */
  export type TraceCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Trace
     */
    select?: TraceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Trace
     */
    omit?: TraceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TraceInclude<ExtArgs> | null
    /**
     * The data needed to create a Trace.
     */
    data: XOR<TraceCreateInput, TraceUncheckedCreateInput>
  }

  /**
   * Trace createMany
   */
  export type TraceCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Traces.
     */
    data: TraceCreateManyInput | TraceCreateManyInput[]
  }

  /**
   * Trace update
   */
  export type TraceUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Trace
     */
    select?: TraceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Trace
     */
    omit?: TraceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TraceInclude<ExtArgs> | null
    /**
     * The data needed to update a Trace.
     */
    data: XOR<TraceUpdateInput, TraceUncheckedUpdateInput>
    /**
     * Choose, which Trace to update.
     */
    where: TraceWhereUniqueInput
  }

  /**
   * Trace updateMany
   */
  export type TraceUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Traces.
     */
    data: XOR<TraceUpdateManyMutationInput, TraceUncheckedUpdateManyInput>
    /**
     * Filter which Traces to update
     */
    where?: TraceWhereInput
    /**
     * Limit how many Traces to update.
     */
    limit?: number
  }

  /**
   * Trace upsert
   */
  export type TraceUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Trace
     */
    select?: TraceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Trace
     */
    omit?: TraceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TraceInclude<ExtArgs> | null
    /**
     * The filter to search for the Trace to update in case it exists.
     */
    where: TraceWhereUniqueInput
    /**
     * In case the Trace found by the `where` argument doesn't exist, create a new Trace with this data.
     */
    create: XOR<TraceCreateInput, TraceUncheckedCreateInput>
    /**
     * In case the Trace was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TraceUpdateInput, TraceUncheckedUpdateInput>
  }

  /**
   * Trace delete
   */
  export type TraceDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Trace
     */
    select?: TraceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Trace
     */
    omit?: TraceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TraceInclude<ExtArgs> | null
    /**
     * Filter which Trace to delete.
     */
    where: TraceWhereUniqueInput
  }

  /**
   * Trace deleteMany
   */
  export type TraceDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Traces to delete
     */
    where?: TraceWhereInput
    /**
     * Limit how many Traces to delete.
     */
    limit?: number
  }

  /**
   * Trace findRaw
   */
  export type TraceFindRawArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The query predicate filter. If unspecified, then all documents in the collection will match the predicate. ${@link https://docs.mongodb.com/manual/reference/operator/query MongoDB Docs}.
     */
    filter?: InputJsonValue
    /**
     * Additional options to pass to the `find` command ${@link https://docs.mongodb.com/manual/reference/command/find/#command-fields MongoDB Docs}.
     */
    options?: InputJsonValue
  }

  /**
   * Trace aggregateRaw
   */
  export type TraceAggregateRawArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * An array of aggregation stages to process and transform the document stream via the aggregation pipeline. ${@link https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline MongoDB Docs}.
     */
    pipeline?: InputJsonValue[]
    /**
     * Additional options to pass to the `aggregate` command ${@link https://docs.mongodb.com/manual/reference/command/aggregate/#command-fields MongoDB Docs}.
     */
    options?: InputJsonValue
  }

  /**
   * Trace.screens
   */
  export type Trace$screensArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Screen
     */
    select?: ScreenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Screen
     */
    omit?: ScreenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScreenInclude<ExtArgs> | null
    where?: ScreenWhereInput
    orderBy?: ScreenOrderByWithRelationInput | ScreenOrderByWithRelationInput[]
    cursor?: ScreenWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ScreenScalarFieldEnum | ScreenScalarFieldEnum[]
  }

  /**
   * Trace.task
   */
  export type Trace$taskArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Task
     */
    omit?: TaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskInclude<ExtArgs> | null
    where?: TaskWhereInput
  }

  /**
   * Trace without action
   */
  export type TraceDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Trace
     */
    select?: TraceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Trace
     */
    omit?: TraceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TraceInclude<ExtArgs> | null
  }


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
    email: string | null
    name: string | null
    role: $Enums.Role | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    email: string | null
    name: string | null
    role: $Enums.Role | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    email: number
    name: number
    role: number
    _all: number
  }


  export type UserMinAggregateInputType = {
    id?: true
    email?: true
    name?: true
    role?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    email?: true
    name?: true
    role?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    email?: true
    name?: true
    role?: true
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
    email: string
    name: string | null
    role: $Enums.Role
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
    email?: boolean
    name?: boolean
    role?: boolean
  }, ExtArgs["result"]["user"]>



  export type UserSelectScalar = {
    id?: boolean
    email?: boolean
    name?: boolean
    role?: boolean
  }

  export type UserOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "email" | "name" | "role", ExtArgs["result"]["user"]>

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      email: string
      name: string | null
      role: $Enums.Role
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
     * Find zero or more Users that matches the filter.
     * @param {UserFindRawArgs} args - Select which filters you would like to apply.
     * @example
     * const user = await prisma.user.findRaw({
     *   filter: { age: { $gt: 25 } }
     * })
     */
    findRaw(args?: UserFindRawArgs): Prisma.PrismaPromise<JsonObject>

    /**
     * Perform aggregation operations on a User.
     * @param {UserAggregateRawArgs} args - Select which aggregations you would like to apply.
     * @example
     * const user = await prisma.user.aggregateRaw({
     *   pipeline: [
     *     { $match: { status: "registered" } },
     *     { $group: { _id: "$country", total: { $sum: 1 } } }
     *   ]
     * })
     */
    aggregateRaw(args?: UserAggregateRawArgs): Prisma.PrismaPromise<JsonObject>


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
    readonly email: FieldRef<"User", 'String'>
    readonly name: FieldRef<"User", 'String'>
    readonly role: FieldRef<"User", 'Role'>
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
   * User findRaw
   */
  export type UserFindRawArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The query predicate filter. If unspecified, then all documents in the collection will match the predicate. ${@link https://docs.mongodb.com/manual/reference/operator/query MongoDB Docs}.
     */
    filter?: InputJsonValue
    /**
     * Additional options to pass to the `find` command ${@link https://docs.mongodb.com/manual/reference/command/find/#command-fields MongoDB Docs}.
     */
    options?: InputJsonValue
  }

  /**
   * User aggregateRaw
   */
  export type UserAggregateRawArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * An array of aggregation stages to process and transform the document stream via the aggregation pipeline. ${@link https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline MongoDB Docs}.
     */
    pipeline?: InputJsonValue[]
    /**
     * Additional options to pass to the `aggregate` command ${@link https://docs.mongodb.com/manual/reference/command/aggregate/#command-fields MongoDB Docs}.
     */
    options?: InputJsonValue
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
  }


  /**
   * Model Task
   */

  export type AggregateTask = {
    _count: TaskCountAggregateOutputType | null
    _min: TaskMinAggregateOutputType | null
    _max: TaskMaxAggregateOutputType | null
  }

  export type TaskMinAggregateOutputType = {
    id: string | null
    appId: string | null
    os: string | null
    description: string | null
  }

  export type TaskMaxAggregateOutputType = {
    id: string | null
    appId: string | null
    os: string | null
    description: string | null
  }

  export type TaskCountAggregateOutputType = {
    id: number
    appId: number
    os: number
    traceIds: number
    description: number
    _all: number
  }


  export type TaskMinAggregateInputType = {
    id?: true
    appId?: true
    os?: true
    description?: true
  }

  export type TaskMaxAggregateInputType = {
    id?: true
    appId?: true
    os?: true
    description?: true
  }

  export type TaskCountAggregateInputType = {
    id?: true
    appId?: true
    os?: true
    traceIds?: true
    description?: true
    _all?: true
  }

  export type TaskAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Task to aggregate.
     */
    where?: TaskWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tasks to fetch.
     */
    orderBy?: TaskOrderByWithRelationInput | TaskOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TaskWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tasks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tasks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Tasks
    **/
    _count?: true | TaskCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TaskMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TaskMaxAggregateInputType
  }

  export type GetTaskAggregateType<T extends TaskAggregateArgs> = {
        [P in keyof T & keyof AggregateTask]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTask[P]>
      : GetScalarType<T[P], AggregateTask[P]>
  }




  export type TaskGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TaskWhereInput
    orderBy?: TaskOrderByWithAggregationInput | TaskOrderByWithAggregationInput[]
    by: TaskScalarFieldEnum[] | TaskScalarFieldEnum
    having?: TaskScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TaskCountAggregateInputType | true
    _min?: TaskMinAggregateInputType
    _max?: TaskMaxAggregateInputType
  }

  export type TaskGroupByOutputType = {
    id: string
    appId: string
    os: string
    traceIds: string[]
    description: string
    _count: TaskCountAggregateOutputType | null
    _min: TaskMinAggregateOutputType | null
    _max: TaskMaxAggregateOutputType | null
  }

  type GetTaskGroupByPayload<T extends TaskGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TaskGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TaskGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TaskGroupByOutputType[P]>
            : GetScalarType<T[P], TaskGroupByOutputType[P]>
        }
      >
    >


  export type TaskSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    appId?: boolean
    os?: boolean
    traceIds?: boolean
    description?: boolean
    traces?: boolean | Task$tracesArgs<ExtArgs>
    Capture?: boolean | Task$CaptureArgs<ExtArgs>
    _count?: boolean | TaskCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["task"]>



  export type TaskSelectScalar = {
    id?: boolean
    appId?: boolean
    os?: boolean
    traceIds?: boolean
    description?: boolean
  }

  export type TaskOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "appId" | "os" | "traceIds" | "description", ExtArgs["result"]["task"]>
  export type TaskInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    traces?: boolean | Task$tracesArgs<ExtArgs>
    Capture?: boolean | Task$CaptureArgs<ExtArgs>
    _count?: boolean | TaskCountOutputTypeDefaultArgs<ExtArgs>
  }

  export type $TaskPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Task"
    objects: {
      traces: Prisma.$TracePayload<ExtArgs>[]
      Capture: Prisma.$CapturePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      appId: string
      os: string
      traceIds: string[]
      description: string
    }, ExtArgs["result"]["task"]>
    composites: {}
  }

  type TaskGetPayload<S extends boolean | null | undefined | TaskDefaultArgs> = $Result.GetResult<Prisma.$TaskPayload, S>

  type TaskCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TaskFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TaskCountAggregateInputType | true
    }

  export interface TaskDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Task'], meta: { name: 'Task' } }
    /**
     * Find zero or one Task that matches the filter.
     * @param {TaskFindUniqueArgs} args - Arguments to find a Task
     * @example
     * // Get one Task
     * const task = await prisma.task.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TaskFindUniqueArgs>(args: SelectSubset<T, TaskFindUniqueArgs<ExtArgs>>): Prisma__TaskClient<$Result.GetResult<Prisma.$TaskPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Task that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TaskFindUniqueOrThrowArgs} args - Arguments to find a Task
     * @example
     * // Get one Task
     * const task = await prisma.task.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TaskFindUniqueOrThrowArgs>(args: SelectSubset<T, TaskFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TaskClient<$Result.GetResult<Prisma.$TaskPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Task that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TaskFindFirstArgs} args - Arguments to find a Task
     * @example
     * // Get one Task
     * const task = await prisma.task.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TaskFindFirstArgs>(args?: SelectSubset<T, TaskFindFirstArgs<ExtArgs>>): Prisma__TaskClient<$Result.GetResult<Prisma.$TaskPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Task that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TaskFindFirstOrThrowArgs} args - Arguments to find a Task
     * @example
     * // Get one Task
     * const task = await prisma.task.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TaskFindFirstOrThrowArgs>(args?: SelectSubset<T, TaskFindFirstOrThrowArgs<ExtArgs>>): Prisma__TaskClient<$Result.GetResult<Prisma.$TaskPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Tasks that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TaskFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Tasks
     * const tasks = await prisma.task.findMany()
     * 
     * // Get first 10 Tasks
     * const tasks = await prisma.task.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const taskWithIdOnly = await prisma.task.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TaskFindManyArgs>(args?: SelectSubset<T, TaskFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TaskPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Task.
     * @param {TaskCreateArgs} args - Arguments to create a Task.
     * @example
     * // Create one Task
     * const Task = await prisma.task.create({
     *   data: {
     *     // ... data to create a Task
     *   }
     * })
     * 
     */
    create<T extends TaskCreateArgs>(args: SelectSubset<T, TaskCreateArgs<ExtArgs>>): Prisma__TaskClient<$Result.GetResult<Prisma.$TaskPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Tasks.
     * @param {TaskCreateManyArgs} args - Arguments to create many Tasks.
     * @example
     * // Create many Tasks
     * const task = await prisma.task.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TaskCreateManyArgs>(args?: SelectSubset<T, TaskCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Task.
     * @param {TaskDeleteArgs} args - Arguments to delete one Task.
     * @example
     * // Delete one Task
     * const Task = await prisma.task.delete({
     *   where: {
     *     // ... filter to delete one Task
     *   }
     * })
     * 
     */
    delete<T extends TaskDeleteArgs>(args: SelectSubset<T, TaskDeleteArgs<ExtArgs>>): Prisma__TaskClient<$Result.GetResult<Prisma.$TaskPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Task.
     * @param {TaskUpdateArgs} args - Arguments to update one Task.
     * @example
     * // Update one Task
     * const task = await prisma.task.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TaskUpdateArgs>(args: SelectSubset<T, TaskUpdateArgs<ExtArgs>>): Prisma__TaskClient<$Result.GetResult<Prisma.$TaskPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Tasks.
     * @param {TaskDeleteManyArgs} args - Arguments to filter Tasks to delete.
     * @example
     * // Delete a few Tasks
     * const { count } = await prisma.task.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TaskDeleteManyArgs>(args?: SelectSubset<T, TaskDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Tasks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TaskUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Tasks
     * const task = await prisma.task.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TaskUpdateManyArgs>(args: SelectSubset<T, TaskUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Task.
     * @param {TaskUpsertArgs} args - Arguments to update or create a Task.
     * @example
     * // Update or create a Task
     * const task = await prisma.task.upsert({
     *   create: {
     *     // ... data to create a Task
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Task we want to update
     *   }
     * })
     */
    upsert<T extends TaskUpsertArgs>(args: SelectSubset<T, TaskUpsertArgs<ExtArgs>>): Prisma__TaskClient<$Result.GetResult<Prisma.$TaskPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Tasks that matches the filter.
     * @param {TaskFindRawArgs} args - Select which filters you would like to apply.
     * @example
     * const task = await prisma.task.findRaw({
     *   filter: { age: { $gt: 25 } }
     * })
     */
    findRaw(args?: TaskFindRawArgs): Prisma.PrismaPromise<JsonObject>

    /**
     * Perform aggregation operations on a Task.
     * @param {TaskAggregateRawArgs} args - Select which aggregations you would like to apply.
     * @example
     * const task = await prisma.task.aggregateRaw({
     *   pipeline: [
     *     { $match: { status: "registered" } },
     *     { $group: { _id: "$country", total: { $sum: 1 } } }
     *   ]
     * })
     */
    aggregateRaw(args?: TaskAggregateRawArgs): Prisma.PrismaPromise<JsonObject>


    /**
     * Count the number of Tasks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TaskCountArgs} args - Arguments to filter Tasks to count.
     * @example
     * // Count the number of Tasks
     * const count = await prisma.task.count({
     *   where: {
     *     // ... the filter for the Tasks we want to count
     *   }
     * })
    **/
    count<T extends TaskCountArgs>(
      args?: Subset<T, TaskCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TaskCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Task.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TaskAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends TaskAggregateArgs>(args: Subset<T, TaskAggregateArgs>): Prisma.PrismaPromise<GetTaskAggregateType<T>>

    /**
     * Group by Task.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TaskGroupByArgs} args - Group by arguments.
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
      T extends TaskGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TaskGroupByArgs['orderBy'] }
        : { orderBy?: TaskGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, TaskGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTaskGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Task model
   */
  readonly fields: TaskFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Task.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TaskClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    traces<T extends Task$tracesArgs<ExtArgs> = {}>(args?: Subset<T, Task$tracesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TracePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    Capture<T extends Task$CaptureArgs<ExtArgs> = {}>(args?: Subset<T, Task$CaptureArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CapturePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
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
   * Fields of the Task model
   */
  interface TaskFieldRefs {
    readonly id: FieldRef<"Task", 'String'>
    readonly appId: FieldRef<"Task", 'String'>
    readonly os: FieldRef<"Task", 'String'>
    readonly traceIds: FieldRef<"Task", 'String[]'>
    readonly description: FieldRef<"Task", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Task findUnique
   */
  export type TaskFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Task
     */
    omit?: TaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskInclude<ExtArgs> | null
    /**
     * Filter, which Task to fetch.
     */
    where: TaskWhereUniqueInput
  }

  /**
   * Task findUniqueOrThrow
   */
  export type TaskFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Task
     */
    omit?: TaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskInclude<ExtArgs> | null
    /**
     * Filter, which Task to fetch.
     */
    where: TaskWhereUniqueInput
  }

  /**
   * Task findFirst
   */
  export type TaskFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Task
     */
    omit?: TaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskInclude<ExtArgs> | null
    /**
     * Filter, which Task to fetch.
     */
    where?: TaskWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tasks to fetch.
     */
    orderBy?: TaskOrderByWithRelationInput | TaskOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Tasks.
     */
    cursor?: TaskWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tasks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tasks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Tasks.
     */
    distinct?: TaskScalarFieldEnum | TaskScalarFieldEnum[]
  }

  /**
   * Task findFirstOrThrow
   */
  export type TaskFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Task
     */
    omit?: TaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskInclude<ExtArgs> | null
    /**
     * Filter, which Task to fetch.
     */
    where?: TaskWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tasks to fetch.
     */
    orderBy?: TaskOrderByWithRelationInput | TaskOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Tasks.
     */
    cursor?: TaskWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tasks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tasks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Tasks.
     */
    distinct?: TaskScalarFieldEnum | TaskScalarFieldEnum[]
  }

  /**
   * Task findMany
   */
  export type TaskFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Task
     */
    omit?: TaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskInclude<ExtArgs> | null
    /**
     * Filter, which Tasks to fetch.
     */
    where?: TaskWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tasks to fetch.
     */
    orderBy?: TaskOrderByWithRelationInput | TaskOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Tasks.
     */
    cursor?: TaskWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tasks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tasks.
     */
    skip?: number
    distinct?: TaskScalarFieldEnum | TaskScalarFieldEnum[]
  }

  /**
   * Task create
   */
  export type TaskCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Task
     */
    omit?: TaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskInclude<ExtArgs> | null
    /**
     * The data needed to create a Task.
     */
    data: XOR<TaskCreateInput, TaskUncheckedCreateInput>
  }

  /**
   * Task createMany
   */
  export type TaskCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Tasks.
     */
    data: TaskCreateManyInput | TaskCreateManyInput[]
  }

  /**
   * Task update
   */
  export type TaskUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Task
     */
    omit?: TaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskInclude<ExtArgs> | null
    /**
     * The data needed to update a Task.
     */
    data: XOR<TaskUpdateInput, TaskUncheckedUpdateInput>
    /**
     * Choose, which Task to update.
     */
    where: TaskWhereUniqueInput
  }

  /**
   * Task updateMany
   */
  export type TaskUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Tasks.
     */
    data: XOR<TaskUpdateManyMutationInput, TaskUncheckedUpdateManyInput>
    /**
     * Filter which Tasks to update
     */
    where?: TaskWhereInput
    /**
     * Limit how many Tasks to update.
     */
    limit?: number
  }

  /**
   * Task upsert
   */
  export type TaskUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Task
     */
    omit?: TaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskInclude<ExtArgs> | null
    /**
     * The filter to search for the Task to update in case it exists.
     */
    where: TaskWhereUniqueInput
    /**
     * In case the Task found by the `where` argument doesn't exist, create a new Task with this data.
     */
    create: XOR<TaskCreateInput, TaskUncheckedCreateInput>
    /**
     * In case the Task was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TaskUpdateInput, TaskUncheckedUpdateInput>
  }

  /**
   * Task delete
   */
  export type TaskDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Task
     */
    omit?: TaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskInclude<ExtArgs> | null
    /**
     * Filter which Task to delete.
     */
    where: TaskWhereUniqueInput
  }

  /**
   * Task deleteMany
   */
  export type TaskDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Tasks to delete
     */
    where?: TaskWhereInput
    /**
     * Limit how many Tasks to delete.
     */
    limit?: number
  }

  /**
   * Task findRaw
   */
  export type TaskFindRawArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The query predicate filter. If unspecified, then all documents in the collection will match the predicate. ${@link https://docs.mongodb.com/manual/reference/operator/query MongoDB Docs}.
     */
    filter?: InputJsonValue
    /**
     * Additional options to pass to the `find` command ${@link https://docs.mongodb.com/manual/reference/command/find/#command-fields MongoDB Docs}.
     */
    options?: InputJsonValue
  }

  /**
   * Task aggregateRaw
   */
  export type TaskAggregateRawArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * An array of aggregation stages to process and transform the document stream via the aggregation pipeline. ${@link https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline MongoDB Docs}.
     */
    pipeline?: InputJsonValue[]
    /**
     * Additional options to pass to the `aggregate` command ${@link https://docs.mongodb.com/manual/reference/command/aggregate/#command-fields MongoDB Docs}.
     */
    options?: InputJsonValue
  }

  /**
   * Task.traces
   */
  export type Task$tracesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Trace
     */
    select?: TraceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Trace
     */
    omit?: TraceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TraceInclude<ExtArgs> | null
    where?: TraceWhereInput
    orderBy?: TraceOrderByWithRelationInput | TraceOrderByWithRelationInput[]
    cursor?: TraceWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TraceScalarFieldEnum | TraceScalarFieldEnum[]
  }

  /**
   * Task.Capture
   */
  export type Task$CaptureArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Capture
     */
    select?: CaptureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Capture
     */
    omit?: CaptureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CaptureInclude<ExtArgs> | null
    where?: CaptureWhereInput
    orderBy?: CaptureOrderByWithRelationInput | CaptureOrderByWithRelationInput[]
    cursor?: CaptureWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CaptureScalarFieldEnum | CaptureScalarFieldEnum[]
  }

  /**
   * Task without action
   */
  export type TaskDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Task
     */
    omit?: TaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskInclude<ExtArgs> | null
  }


  /**
   * Model Capture
   */

  export type AggregateCapture = {
    _count: CaptureCountAggregateOutputType | null
    _min: CaptureMinAggregateOutputType | null
    _max: CaptureMaxAggregateOutputType | null
  }

  export type CaptureMinAggregateOutputType = {
    id: string | null
    appId_: string | null
    appId: string | null
    taskId: string | null
    otp: string | null
    src: string | null
  }

  export type CaptureMaxAggregateOutputType = {
    id: string | null
    appId_: string | null
    appId: string | null
    taskId: string | null
    otp: string | null
    src: string | null
  }

  export type CaptureCountAggregateOutputType = {
    id: number
    appId_: number
    appId: number
    taskId: number
    otp: number
    src: number
    _all: number
  }


  export type CaptureMinAggregateInputType = {
    id?: true
    appId_?: true
    appId?: true
    taskId?: true
    otp?: true
    src?: true
  }

  export type CaptureMaxAggregateInputType = {
    id?: true
    appId_?: true
    appId?: true
    taskId?: true
    otp?: true
    src?: true
  }

  export type CaptureCountAggregateInputType = {
    id?: true
    appId_?: true
    appId?: true
    taskId?: true
    otp?: true
    src?: true
    _all?: true
  }

  export type CaptureAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Capture to aggregate.
     */
    where?: CaptureWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Captures to fetch.
     */
    orderBy?: CaptureOrderByWithRelationInput | CaptureOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CaptureWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Captures from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Captures.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Captures
    **/
    _count?: true | CaptureCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CaptureMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CaptureMaxAggregateInputType
  }

  export type GetCaptureAggregateType<T extends CaptureAggregateArgs> = {
        [P in keyof T & keyof AggregateCapture]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCapture[P]>
      : GetScalarType<T[P], AggregateCapture[P]>
  }




  export type CaptureGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CaptureWhereInput
    orderBy?: CaptureOrderByWithAggregationInput | CaptureOrderByWithAggregationInput[]
    by: CaptureScalarFieldEnum[] | CaptureScalarFieldEnum
    having?: CaptureScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CaptureCountAggregateInputType | true
    _min?: CaptureMinAggregateInputType
    _max?: CaptureMaxAggregateInputType
  }

  export type CaptureGroupByOutputType = {
    id: string
    appId_: string | null
    appId: string
    taskId: string
    otp: string
    src: string
    _count: CaptureCountAggregateOutputType | null
    _min: CaptureMinAggregateOutputType | null
    _max: CaptureMaxAggregateOutputType | null
  }

  type GetCaptureGroupByPayload<T extends CaptureGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CaptureGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CaptureGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CaptureGroupByOutputType[P]>
            : GetScalarType<T[P], CaptureGroupByOutputType[P]>
        }
      >
    >


  export type CaptureSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    appId_?: boolean
    appId?: boolean
    taskId?: boolean
    otp?: boolean
    src?: boolean
    app?: boolean | Capture$appArgs<ExtArgs>
    task?: boolean | TaskDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["capture"]>



  export type CaptureSelectScalar = {
    id?: boolean
    appId_?: boolean
    appId?: boolean
    taskId?: boolean
    otp?: boolean
    src?: boolean
  }

  export type CaptureOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "appId_" | "appId" | "taskId" | "otp" | "src", ExtArgs["result"]["capture"]>
  export type CaptureInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    app?: boolean | Capture$appArgs<ExtArgs>
    task?: boolean | TaskDefaultArgs<ExtArgs>
  }

  export type $CapturePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Capture"
    objects: {
      app: Prisma.$AppPayload<ExtArgs> | null
      task: Prisma.$TaskPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      appId_: string | null
      appId: string
      taskId: string
      otp: string
      src: string
    }, ExtArgs["result"]["capture"]>
    composites: {}
  }

  type CaptureGetPayload<S extends boolean | null | undefined | CaptureDefaultArgs> = $Result.GetResult<Prisma.$CapturePayload, S>

  type CaptureCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CaptureFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CaptureCountAggregateInputType | true
    }

  export interface CaptureDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Capture'], meta: { name: 'Capture' } }
    /**
     * Find zero or one Capture that matches the filter.
     * @param {CaptureFindUniqueArgs} args - Arguments to find a Capture
     * @example
     * // Get one Capture
     * const capture = await prisma.capture.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CaptureFindUniqueArgs>(args: SelectSubset<T, CaptureFindUniqueArgs<ExtArgs>>): Prisma__CaptureClient<$Result.GetResult<Prisma.$CapturePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Capture that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CaptureFindUniqueOrThrowArgs} args - Arguments to find a Capture
     * @example
     * // Get one Capture
     * const capture = await prisma.capture.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CaptureFindUniqueOrThrowArgs>(args: SelectSubset<T, CaptureFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CaptureClient<$Result.GetResult<Prisma.$CapturePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Capture that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CaptureFindFirstArgs} args - Arguments to find a Capture
     * @example
     * // Get one Capture
     * const capture = await prisma.capture.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CaptureFindFirstArgs>(args?: SelectSubset<T, CaptureFindFirstArgs<ExtArgs>>): Prisma__CaptureClient<$Result.GetResult<Prisma.$CapturePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Capture that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CaptureFindFirstOrThrowArgs} args - Arguments to find a Capture
     * @example
     * // Get one Capture
     * const capture = await prisma.capture.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CaptureFindFirstOrThrowArgs>(args?: SelectSubset<T, CaptureFindFirstOrThrowArgs<ExtArgs>>): Prisma__CaptureClient<$Result.GetResult<Prisma.$CapturePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Captures that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CaptureFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Captures
     * const captures = await prisma.capture.findMany()
     * 
     * // Get first 10 Captures
     * const captures = await prisma.capture.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const captureWithIdOnly = await prisma.capture.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CaptureFindManyArgs>(args?: SelectSubset<T, CaptureFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CapturePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Capture.
     * @param {CaptureCreateArgs} args - Arguments to create a Capture.
     * @example
     * // Create one Capture
     * const Capture = await prisma.capture.create({
     *   data: {
     *     // ... data to create a Capture
     *   }
     * })
     * 
     */
    create<T extends CaptureCreateArgs>(args: SelectSubset<T, CaptureCreateArgs<ExtArgs>>): Prisma__CaptureClient<$Result.GetResult<Prisma.$CapturePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Captures.
     * @param {CaptureCreateManyArgs} args - Arguments to create many Captures.
     * @example
     * // Create many Captures
     * const capture = await prisma.capture.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CaptureCreateManyArgs>(args?: SelectSubset<T, CaptureCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Capture.
     * @param {CaptureDeleteArgs} args - Arguments to delete one Capture.
     * @example
     * // Delete one Capture
     * const Capture = await prisma.capture.delete({
     *   where: {
     *     // ... filter to delete one Capture
     *   }
     * })
     * 
     */
    delete<T extends CaptureDeleteArgs>(args: SelectSubset<T, CaptureDeleteArgs<ExtArgs>>): Prisma__CaptureClient<$Result.GetResult<Prisma.$CapturePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Capture.
     * @param {CaptureUpdateArgs} args - Arguments to update one Capture.
     * @example
     * // Update one Capture
     * const capture = await prisma.capture.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CaptureUpdateArgs>(args: SelectSubset<T, CaptureUpdateArgs<ExtArgs>>): Prisma__CaptureClient<$Result.GetResult<Prisma.$CapturePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Captures.
     * @param {CaptureDeleteManyArgs} args - Arguments to filter Captures to delete.
     * @example
     * // Delete a few Captures
     * const { count } = await prisma.capture.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CaptureDeleteManyArgs>(args?: SelectSubset<T, CaptureDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Captures.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CaptureUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Captures
     * const capture = await prisma.capture.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CaptureUpdateManyArgs>(args: SelectSubset<T, CaptureUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Capture.
     * @param {CaptureUpsertArgs} args - Arguments to update or create a Capture.
     * @example
     * // Update or create a Capture
     * const capture = await prisma.capture.upsert({
     *   create: {
     *     // ... data to create a Capture
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Capture we want to update
     *   }
     * })
     */
    upsert<T extends CaptureUpsertArgs>(args: SelectSubset<T, CaptureUpsertArgs<ExtArgs>>): Prisma__CaptureClient<$Result.GetResult<Prisma.$CapturePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Captures that matches the filter.
     * @param {CaptureFindRawArgs} args - Select which filters you would like to apply.
     * @example
     * const capture = await prisma.capture.findRaw({
     *   filter: { age: { $gt: 25 } }
     * })
     */
    findRaw(args?: CaptureFindRawArgs): Prisma.PrismaPromise<JsonObject>

    /**
     * Perform aggregation operations on a Capture.
     * @param {CaptureAggregateRawArgs} args - Select which aggregations you would like to apply.
     * @example
     * const capture = await prisma.capture.aggregateRaw({
     *   pipeline: [
     *     { $match: { status: "registered" } },
     *     { $group: { _id: "$country", total: { $sum: 1 } } }
     *   ]
     * })
     */
    aggregateRaw(args?: CaptureAggregateRawArgs): Prisma.PrismaPromise<JsonObject>


    /**
     * Count the number of Captures.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CaptureCountArgs} args - Arguments to filter Captures to count.
     * @example
     * // Count the number of Captures
     * const count = await prisma.capture.count({
     *   where: {
     *     // ... the filter for the Captures we want to count
     *   }
     * })
    **/
    count<T extends CaptureCountArgs>(
      args?: Subset<T, CaptureCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CaptureCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Capture.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CaptureAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends CaptureAggregateArgs>(args: Subset<T, CaptureAggregateArgs>): Prisma.PrismaPromise<GetCaptureAggregateType<T>>

    /**
     * Group by Capture.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CaptureGroupByArgs} args - Group by arguments.
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
      T extends CaptureGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CaptureGroupByArgs['orderBy'] }
        : { orderBy?: CaptureGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, CaptureGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCaptureGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Capture model
   */
  readonly fields: CaptureFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Capture.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CaptureClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    app<T extends Capture$appArgs<ExtArgs> = {}>(args?: Subset<T, Capture$appArgs<ExtArgs>>): Prisma__AppClient<$Result.GetResult<Prisma.$AppPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    task<T extends TaskDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TaskDefaultArgs<ExtArgs>>): Prisma__TaskClient<$Result.GetResult<Prisma.$TaskPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
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
   * Fields of the Capture model
   */
  interface CaptureFieldRefs {
    readonly id: FieldRef<"Capture", 'String'>
    readonly appId_: FieldRef<"Capture", 'String'>
    readonly appId: FieldRef<"Capture", 'String'>
    readonly taskId: FieldRef<"Capture", 'String'>
    readonly otp: FieldRef<"Capture", 'String'>
    readonly src: FieldRef<"Capture", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Capture findUnique
   */
  export type CaptureFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Capture
     */
    select?: CaptureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Capture
     */
    omit?: CaptureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CaptureInclude<ExtArgs> | null
    /**
     * Filter, which Capture to fetch.
     */
    where: CaptureWhereUniqueInput
  }

  /**
   * Capture findUniqueOrThrow
   */
  export type CaptureFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Capture
     */
    select?: CaptureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Capture
     */
    omit?: CaptureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CaptureInclude<ExtArgs> | null
    /**
     * Filter, which Capture to fetch.
     */
    where: CaptureWhereUniqueInput
  }

  /**
   * Capture findFirst
   */
  export type CaptureFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Capture
     */
    select?: CaptureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Capture
     */
    omit?: CaptureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CaptureInclude<ExtArgs> | null
    /**
     * Filter, which Capture to fetch.
     */
    where?: CaptureWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Captures to fetch.
     */
    orderBy?: CaptureOrderByWithRelationInput | CaptureOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Captures.
     */
    cursor?: CaptureWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Captures from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Captures.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Captures.
     */
    distinct?: CaptureScalarFieldEnum | CaptureScalarFieldEnum[]
  }

  /**
   * Capture findFirstOrThrow
   */
  export type CaptureFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Capture
     */
    select?: CaptureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Capture
     */
    omit?: CaptureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CaptureInclude<ExtArgs> | null
    /**
     * Filter, which Capture to fetch.
     */
    where?: CaptureWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Captures to fetch.
     */
    orderBy?: CaptureOrderByWithRelationInput | CaptureOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Captures.
     */
    cursor?: CaptureWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Captures from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Captures.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Captures.
     */
    distinct?: CaptureScalarFieldEnum | CaptureScalarFieldEnum[]
  }

  /**
   * Capture findMany
   */
  export type CaptureFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Capture
     */
    select?: CaptureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Capture
     */
    omit?: CaptureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CaptureInclude<ExtArgs> | null
    /**
     * Filter, which Captures to fetch.
     */
    where?: CaptureWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Captures to fetch.
     */
    orderBy?: CaptureOrderByWithRelationInput | CaptureOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Captures.
     */
    cursor?: CaptureWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Captures from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Captures.
     */
    skip?: number
    distinct?: CaptureScalarFieldEnum | CaptureScalarFieldEnum[]
  }

  /**
   * Capture create
   */
  export type CaptureCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Capture
     */
    select?: CaptureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Capture
     */
    omit?: CaptureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CaptureInclude<ExtArgs> | null
    /**
     * The data needed to create a Capture.
     */
    data: XOR<CaptureCreateInput, CaptureUncheckedCreateInput>
  }

  /**
   * Capture createMany
   */
  export type CaptureCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Captures.
     */
    data: CaptureCreateManyInput | CaptureCreateManyInput[]
  }

  /**
   * Capture update
   */
  export type CaptureUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Capture
     */
    select?: CaptureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Capture
     */
    omit?: CaptureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CaptureInclude<ExtArgs> | null
    /**
     * The data needed to update a Capture.
     */
    data: XOR<CaptureUpdateInput, CaptureUncheckedUpdateInput>
    /**
     * Choose, which Capture to update.
     */
    where: CaptureWhereUniqueInput
  }

  /**
   * Capture updateMany
   */
  export type CaptureUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Captures.
     */
    data: XOR<CaptureUpdateManyMutationInput, CaptureUncheckedUpdateManyInput>
    /**
     * Filter which Captures to update
     */
    where?: CaptureWhereInput
    /**
     * Limit how many Captures to update.
     */
    limit?: number
  }

  /**
   * Capture upsert
   */
  export type CaptureUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Capture
     */
    select?: CaptureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Capture
     */
    omit?: CaptureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CaptureInclude<ExtArgs> | null
    /**
     * The filter to search for the Capture to update in case it exists.
     */
    where: CaptureWhereUniqueInput
    /**
     * In case the Capture found by the `where` argument doesn't exist, create a new Capture with this data.
     */
    create: XOR<CaptureCreateInput, CaptureUncheckedCreateInput>
    /**
     * In case the Capture was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CaptureUpdateInput, CaptureUncheckedUpdateInput>
  }

  /**
   * Capture delete
   */
  export type CaptureDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Capture
     */
    select?: CaptureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Capture
     */
    omit?: CaptureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CaptureInclude<ExtArgs> | null
    /**
     * Filter which Capture to delete.
     */
    where: CaptureWhereUniqueInput
  }

  /**
   * Capture deleteMany
   */
  export type CaptureDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Captures to delete
     */
    where?: CaptureWhereInput
    /**
     * Limit how many Captures to delete.
     */
    limit?: number
  }

  /**
   * Capture findRaw
   */
  export type CaptureFindRawArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The query predicate filter. If unspecified, then all documents in the collection will match the predicate. ${@link https://docs.mongodb.com/manual/reference/operator/query MongoDB Docs}.
     */
    filter?: InputJsonValue
    /**
     * Additional options to pass to the `find` command ${@link https://docs.mongodb.com/manual/reference/command/find/#command-fields MongoDB Docs}.
     */
    options?: InputJsonValue
  }

  /**
   * Capture aggregateRaw
   */
  export type CaptureAggregateRawArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * An array of aggregation stages to process and transform the document stream via the aggregation pipeline. ${@link https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline MongoDB Docs}.
     */
    pipeline?: InputJsonValue[]
    /**
     * Additional options to pass to the `aggregate` command ${@link https://docs.mongodb.com/manual/reference/command/aggregate/#command-fields MongoDB Docs}.
     */
    options?: InputJsonValue
  }

  /**
   * Capture.app
   */
  export type Capture$appArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the App
     */
    select?: AppSelect<ExtArgs> | null
    /**
     * Omit specific fields from the App
     */
    omit?: AppOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AppInclude<ExtArgs> | null
    where?: AppWhereInput
  }

  /**
   * Capture without action
   */
  export type CaptureDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Capture
     */
    select?: CaptureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Capture
     */
    omit?: CaptureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CaptureInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const AppScalarFieldEnum: {
    id: 'id',
    v: 'v',
    packageName: 'packageName'
  };

  export type AppScalarFieldEnum = (typeof AppScalarFieldEnum)[keyof typeof AppScalarFieldEnum]


  export const RedactionScalarFieldEnum: {
    id: 'id',
    v: 'v',
    label: 'label',
    screen: 'screen'
  };

  export type RedactionScalarFieldEnum = (typeof RedactionScalarFieldEnum)[keyof typeof RedactionScalarFieldEnum]


  export const ScreenScalarFieldEnum: {
    id: 'id',
    v: 'v',
    created: 'created',
    src: 'src',
    vh: 'vh',
    traceId: 'traceId'
  };

  export type ScreenScalarFieldEnum = (typeof ScreenScalarFieldEnum)[keyof typeof ScreenScalarFieldEnum]


  export const TraceScalarFieldEnum: {
    id: 'id',
    v: 'v',
    appId: 'appId',
    created: 'created',
    name: 'name',
    description: 'description',
    screenIds: 'screenIds',
    taskId: 'taskId',
    worker: 'worker'
  };

  export type TraceScalarFieldEnum = (typeof TraceScalarFieldEnum)[keyof typeof TraceScalarFieldEnum]


  export const UserScalarFieldEnum: {
    id: 'id',
    email: 'email',
    name: 'name',
    role: 'role'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const TaskScalarFieldEnum: {
    id: 'id',
    appId: 'appId',
    os: 'os',
    traceIds: 'traceIds',
    description: 'description'
  };

  export type TaskScalarFieldEnum = (typeof TaskScalarFieldEnum)[keyof typeof TaskScalarFieldEnum]


  export const CaptureScalarFieldEnum: {
    id: 'id',
    appId_: 'appId_',
    appId: 'appId',
    taskId: 'taskId',
    otp: 'otp',
    src: 'src'
  };

  export type CaptureScalarFieldEnum = (typeof CaptureScalarFieldEnum)[keyof typeof CaptureScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


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
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Role'
   */
  export type EnumRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Role'>
    


  /**
   * Reference to a field of type 'Role[]'
   */
  export type ListEnumRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Role[]'>
    


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


  export type AppWhereInput = {
    AND?: AppWhereInput | AppWhereInput[]
    OR?: AppWhereInput[]
    NOT?: AppWhereInput | AppWhereInput[]
    id?: StringFilter<"App"> | string
    v?: IntNullableFilter<"App"> | number | null
    category?: XOR<AppsCategoryNullableCompositeFilter, AppsCategoryObjectEqualityInput> | null
    packageName?: StringFilter<"App"> | string
    metadata?: XOR<AppMetadataCompositeFilter, AppMetadataObjectEqualityInput>
    Capture?: CaptureListRelationFilter
  }

  export type AppOrderByWithRelationInput = {
    id?: SortOrder
    v?: SortOrder
    category?: AppsCategoryOrderByInput
    packageName?: SortOrder
    metadata?: AppMetadataOrderByInput
    Capture?: CaptureOrderByRelationAggregateInput
  }

  export type AppWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    packageName?: string
    AND?: AppWhereInput | AppWhereInput[]
    OR?: AppWhereInput[]
    NOT?: AppWhereInput | AppWhereInput[]
    v?: IntNullableFilter<"App"> | number | null
    category?: XOR<AppsCategoryNullableCompositeFilter, AppsCategoryObjectEqualityInput> | null
    metadata?: XOR<AppMetadataCompositeFilter, AppMetadataObjectEqualityInput>
    Capture?: CaptureListRelationFilter
  }, "id" | "packageName">

  export type AppOrderByWithAggregationInput = {
    id?: SortOrder
    v?: SortOrder
    packageName?: SortOrder
    _count?: AppCountOrderByAggregateInput
    _avg?: AppAvgOrderByAggregateInput
    _max?: AppMaxOrderByAggregateInput
    _min?: AppMinOrderByAggregateInput
    _sum?: AppSumOrderByAggregateInput
  }

  export type AppScalarWhereWithAggregatesInput = {
    AND?: AppScalarWhereWithAggregatesInput | AppScalarWhereWithAggregatesInput[]
    OR?: AppScalarWhereWithAggregatesInput[]
    NOT?: AppScalarWhereWithAggregatesInput | AppScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"App"> | string
    v?: IntNullableWithAggregatesFilter<"App"> | number | null
    packageName?: StringWithAggregatesFilter<"App"> | string
  }

  export type RedactionWhereInput = {
    AND?: RedactionWhereInput | RedactionWhereInput[]
    OR?: RedactionWhereInput[]
    NOT?: RedactionWhereInput | RedactionWhereInput[]
    id?: StringFilter<"Redaction"> | string
    v?: IntFilter<"Redaction"> | number
    label?: StringFilter<"Redaction"> | string
    screen?: StringFilter<"Redaction"> | string
  }

  export type RedactionOrderByWithRelationInput = {
    id?: SortOrder
    v?: SortOrder
    label?: SortOrder
    screen?: SortOrder
  }

  export type RedactionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: RedactionWhereInput | RedactionWhereInput[]
    OR?: RedactionWhereInput[]
    NOT?: RedactionWhereInput | RedactionWhereInput[]
    v?: IntFilter<"Redaction"> | number
    label?: StringFilter<"Redaction"> | string
    screen?: StringFilter<"Redaction"> | string
  }, "id">

  export type RedactionOrderByWithAggregationInput = {
    id?: SortOrder
    v?: SortOrder
    label?: SortOrder
    screen?: SortOrder
    _count?: RedactionCountOrderByAggregateInput
    _avg?: RedactionAvgOrderByAggregateInput
    _max?: RedactionMaxOrderByAggregateInput
    _min?: RedactionMinOrderByAggregateInput
    _sum?: RedactionSumOrderByAggregateInput
  }

  export type RedactionScalarWhereWithAggregatesInput = {
    AND?: RedactionScalarWhereWithAggregatesInput | RedactionScalarWhereWithAggregatesInput[]
    OR?: RedactionScalarWhereWithAggregatesInput[]
    NOT?: RedactionScalarWhereWithAggregatesInput | RedactionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Redaction"> | string
    v?: IntWithAggregatesFilter<"Redaction"> | number
    label?: StringWithAggregatesFilter<"Redaction"> | string
    screen?: StringWithAggregatesFilter<"Redaction"> | string
  }

  export type ScreenWhereInput = {
    AND?: ScreenWhereInput | ScreenWhereInput[]
    OR?: ScreenWhereInput[]
    NOT?: ScreenWhereInput | ScreenWhereInput[]
    id?: StringFilter<"Screen"> | string
    v?: IntFilter<"Screen"> | number
    created?: DateTimeFilter<"Screen"> | Date | string
    gesture?: XOR<ScreenGestureCompositeFilter, ScreenGestureObjectEqualityInput>
    src?: StringFilter<"Screen"> | string
    vh?: StringFilter<"Screen"> | string
    traceId?: StringFilter<"Screen"> | string
    trace?: XOR<TraceScalarRelationFilter, TraceWhereInput>
  }

  export type ScreenOrderByWithRelationInput = {
    id?: SortOrder
    v?: SortOrder
    created?: SortOrder
    gesture?: ScreenGestureOrderByInput
    src?: SortOrder
    vh?: SortOrder
    traceId?: SortOrder
    trace?: TraceOrderByWithRelationInput
  }

  export type ScreenWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ScreenWhereInput | ScreenWhereInput[]
    OR?: ScreenWhereInput[]
    NOT?: ScreenWhereInput | ScreenWhereInput[]
    v?: IntFilter<"Screen"> | number
    created?: DateTimeFilter<"Screen"> | Date | string
    gesture?: XOR<ScreenGestureCompositeFilter, ScreenGestureObjectEqualityInput>
    src?: StringFilter<"Screen"> | string
    vh?: StringFilter<"Screen"> | string
    traceId?: StringFilter<"Screen"> | string
    trace?: XOR<TraceScalarRelationFilter, TraceWhereInput>
  }, "id">

  export type ScreenOrderByWithAggregationInput = {
    id?: SortOrder
    v?: SortOrder
    created?: SortOrder
    src?: SortOrder
    vh?: SortOrder
    traceId?: SortOrder
    _count?: ScreenCountOrderByAggregateInput
    _avg?: ScreenAvgOrderByAggregateInput
    _max?: ScreenMaxOrderByAggregateInput
    _min?: ScreenMinOrderByAggregateInput
    _sum?: ScreenSumOrderByAggregateInput
  }

  export type ScreenScalarWhereWithAggregatesInput = {
    AND?: ScreenScalarWhereWithAggregatesInput | ScreenScalarWhereWithAggregatesInput[]
    OR?: ScreenScalarWhereWithAggregatesInput[]
    NOT?: ScreenScalarWhereWithAggregatesInput | ScreenScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Screen"> | string
    v?: IntWithAggregatesFilter<"Screen"> | number
    created?: DateTimeWithAggregatesFilter<"Screen"> | Date | string
    src?: StringWithAggregatesFilter<"Screen"> | string
    vh?: StringWithAggregatesFilter<"Screen"> | string
    traceId?: StringWithAggregatesFilter<"Screen"> | string
  }

  export type TraceWhereInput = {
    AND?: TraceWhereInput | TraceWhereInput[]
    OR?: TraceWhereInput[]
    NOT?: TraceWhereInput | TraceWhereInput[]
    id?: StringFilter<"Trace"> | string
    v?: IntFilter<"Trace"> | number
    appId?: StringFilter<"Trace"> | string
    created?: DateTimeFilter<"Trace"> | Date | string
    name?: StringNullableFilter<"Trace"> | string | null
    description?: StringFilter<"Trace"> | string
    screenIds?: StringNullableListFilter<"Trace">
    taskId?: StringNullableFilter<"Trace"> | string | null
    worker?: StringFilter<"Trace"> | string
    screens?: ScreenListRelationFilter
    task?: XOR<TaskNullableScalarRelationFilter, TaskWhereInput> | null
  }

  export type TraceOrderByWithRelationInput = {
    id?: SortOrder
    v?: SortOrder
    appId?: SortOrder
    created?: SortOrder
    name?: SortOrder
    description?: SortOrder
    screenIds?: SortOrder
    taskId?: SortOrder
    worker?: SortOrder
    screens?: ScreenOrderByRelationAggregateInput
    task?: TaskOrderByWithRelationInput
  }

  export type TraceWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: TraceWhereInput | TraceWhereInput[]
    OR?: TraceWhereInput[]
    NOT?: TraceWhereInput | TraceWhereInput[]
    v?: IntFilter<"Trace"> | number
    appId?: StringFilter<"Trace"> | string
    created?: DateTimeFilter<"Trace"> | Date | string
    name?: StringNullableFilter<"Trace"> | string | null
    description?: StringFilter<"Trace"> | string
    screenIds?: StringNullableListFilter<"Trace">
    taskId?: StringNullableFilter<"Trace"> | string | null
    worker?: StringFilter<"Trace"> | string
    screens?: ScreenListRelationFilter
    task?: XOR<TaskNullableScalarRelationFilter, TaskWhereInput> | null
  }, "id">

  export type TraceOrderByWithAggregationInput = {
    id?: SortOrder
    v?: SortOrder
    appId?: SortOrder
    created?: SortOrder
    name?: SortOrder
    description?: SortOrder
    screenIds?: SortOrder
    taskId?: SortOrder
    worker?: SortOrder
    _count?: TraceCountOrderByAggregateInput
    _avg?: TraceAvgOrderByAggregateInput
    _max?: TraceMaxOrderByAggregateInput
    _min?: TraceMinOrderByAggregateInput
    _sum?: TraceSumOrderByAggregateInput
  }

  export type TraceScalarWhereWithAggregatesInput = {
    AND?: TraceScalarWhereWithAggregatesInput | TraceScalarWhereWithAggregatesInput[]
    OR?: TraceScalarWhereWithAggregatesInput[]
    NOT?: TraceScalarWhereWithAggregatesInput | TraceScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Trace"> | string
    v?: IntWithAggregatesFilter<"Trace"> | number
    appId?: StringWithAggregatesFilter<"Trace"> | string
    created?: DateTimeWithAggregatesFilter<"Trace"> | Date | string
    name?: StringNullableWithAggregatesFilter<"Trace"> | string | null
    description?: StringWithAggregatesFilter<"Trace"> | string
    screenIds?: StringNullableListFilter<"Trace">
    taskId?: StringNullableWithAggregatesFilter<"Trace"> | string | null
    worker?: StringWithAggregatesFilter<"Trace"> | string
  }

  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: StringFilter<"User"> | string
    email?: StringFilter<"User"> | string
    name?: StringNullableFilter<"User"> | string | null
    role?: EnumRoleFilter<"User"> | $Enums.Role
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
    role?: SortOrder
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    email?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    name?: StringNullableFilter<"User"> | string | null
    role?: EnumRoleFilter<"User"> | $Enums.Role
  }, "id" | "email">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
    role?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"User"> | string
    email?: StringWithAggregatesFilter<"User"> | string
    name?: StringNullableWithAggregatesFilter<"User"> | string | null
    role?: EnumRoleWithAggregatesFilter<"User"> | $Enums.Role
  }

  export type TaskWhereInput = {
    AND?: TaskWhereInput | TaskWhereInput[]
    OR?: TaskWhereInput[]
    NOT?: TaskWhereInput | TaskWhereInput[]
    id?: StringFilter<"Task"> | string
    appId?: StringFilter<"Task"> | string
    os?: StringFilter<"Task"> | string
    traceIds?: StringNullableListFilter<"Task">
    description?: StringFilter<"Task"> | string
    traces?: TraceListRelationFilter
    Capture?: CaptureListRelationFilter
  }

  export type TaskOrderByWithRelationInput = {
    id?: SortOrder
    appId?: SortOrder
    os?: SortOrder
    traceIds?: SortOrder
    description?: SortOrder
    traces?: TraceOrderByRelationAggregateInput
    Capture?: CaptureOrderByRelationAggregateInput
  }

  export type TaskWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: TaskWhereInput | TaskWhereInput[]
    OR?: TaskWhereInput[]
    NOT?: TaskWhereInput | TaskWhereInput[]
    appId?: StringFilter<"Task"> | string
    os?: StringFilter<"Task"> | string
    traceIds?: StringNullableListFilter<"Task">
    description?: StringFilter<"Task"> | string
    traces?: TraceListRelationFilter
    Capture?: CaptureListRelationFilter
  }, "id">

  export type TaskOrderByWithAggregationInput = {
    id?: SortOrder
    appId?: SortOrder
    os?: SortOrder
    traceIds?: SortOrder
    description?: SortOrder
    _count?: TaskCountOrderByAggregateInput
    _max?: TaskMaxOrderByAggregateInput
    _min?: TaskMinOrderByAggregateInput
  }

  export type TaskScalarWhereWithAggregatesInput = {
    AND?: TaskScalarWhereWithAggregatesInput | TaskScalarWhereWithAggregatesInput[]
    OR?: TaskScalarWhereWithAggregatesInput[]
    NOT?: TaskScalarWhereWithAggregatesInput | TaskScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Task"> | string
    appId?: StringWithAggregatesFilter<"Task"> | string
    os?: StringWithAggregatesFilter<"Task"> | string
    traceIds?: StringNullableListFilter<"Task">
    description?: StringWithAggregatesFilter<"Task"> | string
  }

  export type CaptureWhereInput = {
    AND?: CaptureWhereInput | CaptureWhereInput[]
    OR?: CaptureWhereInput[]
    NOT?: CaptureWhereInput | CaptureWhereInput[]
    id?: StringFilter<"Capture"> | string
    appId_?: StringNullableFilter<"Capture"> | string | null
    appId?: StringFilter<"Capture"> | string
    taskId?: StringFilter<"Capture"> | string
    otp?: StringFilter<"Capture"> | string
    src?: StringFilter<"Capture"> | string
    app?: XOR<AppNullableScalarRelationFilter, AppWhereInput> | null
    task?: XOR<TaskScalarRelationFilter, TaskWhereInput>
  }

  export type CaptureOrderByWithRelationInput = {
    id?: SortOrder
    appId_?: SortOrder
    appId?: SortOrder
    taskId?: SortOrder
    otp?: SortOrder
    src?: SortOrder
    app?: AppOrderByWithRelationInput
    task?: TaskOrderByWithRelationInput
  }

  export type CaptureWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: CaptureWhereInput | CaptureWhereInput[]
    OR?: CaptureWhereInput[]
    NOT?: CaptureWhereInput | CaptureWhereInput[]
    appId_?: StringNullableFilter<"Capture"> | string | null
    appId?: StringFilter<"Capture"> | string
    taskId?: StringFilter<"Capture"> | string
    otp?: StringFilter<"Capture"> | string
    src?: StringFilter<"Capture"> | string
    app?: XOR<AppNullableScalarRelationFilter, AppWhereInput> | null
    task?: XOR<TaskScalarRelationFilter, TaskWhereInput>
  }, "id">

  export type CaptureOrderByWithAggregationInput = {
    id?: SortOrder
    appId_?: SortOrder
    appId?: SortOrder
    taskId?: SortOrder
    otp?: SortOrder
    src?: SortOrder
    _count?: CaptureCountOrderByAggregateInput
    _max?: CaptureMaxOrderByAggregateInput
    _min?: CaptureMinOrderByAggregateInput
  }

  export type CaptureScalarWhereWithAggregatesInput = {
    AND?: CaptureScalarWhereWithAggregatesInput | CaptureScalarWhereWithAggregatesInput[]
    OR?: CaptureScalarWhereWithAggregatesInput[]
    NOT?: CaptureScalarWhereWithAggregatesInput | CaptureScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Capture"> | string
    appId_?: StringNullableWithAggregatesFilter<"Capture"> | string | null
    appId?: StringWithAggregatesFilter<"Capture"> | string
    taskId?: StringWithAggregatesFilter<"Capture"> | string
    otp?: StringWithAggregatesFilter<"Capture"> | string
    src?: StringWithAggregatesFilter<"Capture"> | string
  }

  export type AppCreateInput = {
    id?: string
    v?: number | null
    category?: XOR<AppsCategoryNullableCreateEnvelopeInput, AppsCategoryCreateInput> | null
    packageName: string
    metadata: XOR<AppMetadataCreateEnvelopeInput, AppMetadataCreateInput>
    Capture?: CaptureCreateNestedManyWithoutAppInput
  }

  export type AppUncheckedCreateInput = {
    id?: string
    v?: number | null
    category?: XOR<AppsCategoryNullableCreateEnvelopeInput, AppsCategoryCreateInput> | null
    packageName: string
    metadata: XOR<AppMetadataCreateEnvelopeInput, AppMetadataCreateInput>
    Capture?: CaptureUncheckedCreateNestedManyWithoutAppInput
  }

  export type AppUpdateInput = {
    v?: NullableIntFieldUpdateOperationsInput | number | null
    category?: XOR<AppsCategoryNullableUpdateEnvelopeInput, AppsCategoryCreateInput> | null
    packageName?: StringFieldUpdateOperationsInput | string
    metadata?: XOR<AppMetadataUpdateEnvelopeInput, AppMetadataCreateInput>
    Capture?: CaptureUpdateManyWithoutAppNestedInput
  }

  export type AppUncheckedUpdateInput = {
    v?: NullableIntFieldUpdateOperationsInput | number | null
    category?: XOR<AppsCategoryNullableUpdateEnvelopeInput, AppsCategoryCreateInput> | null
    packageName?: StringFieldUpdateOperationsInput | string
    metadata?: XOR<AppMetadataUpdateEnvelopeInput, AppMetadataCreateInput>
    Capture?: CaptureUncheckedUpdateManyWithoutAppNestedInput
  }

  export type AppCreateManyInput = {
    id?: string
    v?: number | null
    category?: XOR<AppsCategoryNullableCreateEnvelopeInput, AppsCategoryCreateInput> | null
    packageName: string
    metadata: XOR<AppMetadataCreateEnvelopeInput, AppMetadataCreateInput>
  }

  export type AppUpdateManyMutationInput = {
    v?: NullableIntFieldUpdateOperationsInput | number | null
    category?: XOR<AppsCategoryNullableUpdateEnvelopeInput, AppsCategoryCreateInput> | null
    packageName?: StringFieldUpdateOperationsInput | string
    metadata?: XOR<AppMetadataUpdateEnvelopeInput, AppMetadataCreateInput>
  }

  export type AppUncheckedUpdateManyInput = {
    v?: NullableIntFieldUpdateOperationsInput | number | null
    category?: XOR<AppsCategoryNullableUpdateEnvelopeInput, AppsCategoryCreateInput> | null
    packageName?: StringFieldUpdateOperationsInput | string
    metadata?: XOR<AppMetadataUpdateEnvelopeInput, AppMetadataCreateInput>
  }

  export type RedactionCreateInput = {
    id?: string
    v?: number
    label: string
    screen: string
  }

  export type RedactionUncheckedCreateInput = {
    id?: string
    v?: number
    label: string
    screen: string
  }

  export type RedactionUpdateInput = {
    v?: IntFieldUpdateOperationsInput | number
    label?: StringFieldUpdateOperationsInput | string
    screen?: StringFieldUpdateOperationsInput | string
  }

  export type RedactionUncheckedUpdateInput = {
    v?: IntFieldUpdateOperationsInput | number
    label?: StringFieldUpdateOperationsInput | string
    screen?: StringFieldUpdateOperationsInput | string
  }

  export type RedactionCreateManyInput = {
    id?: string
    v?: number
    label: string
    screen: string
  }

  export type RedactionUpdateManyMutationInput = {
    v?: IntFieldUpdateOperationsInput | number
    label?: StringFieldUpdateOperationsInput | string
    screen?: StringFieldUpdateOperationsInput | string
  }

  export type RedactionUncheckedUpdateManyInput = {
    v?: IntFieldUpdateOperationsInput | number
    label?: StringFieldUpdateOperationsInput | string
    screen?: StringFieldUpdateOperationsInput | string
  }

  export type ScreenCreateInput = {
    id?: string
    v?: number
    created?: Date | string
    gesture: XOR<ScreenGestureCreateEnvelopeInput, ScreenGestureCreateInput>
    src: string
    vh: string
    trace: TraceCreateNestedOneWithoutScreensInput
  }

  export type ScreenUncheckedCreateInput = {
    id?: string
    v?: number
    created?: Date | string
    gesture: XOR<ScreenGestureCreateEnvelopeInput, ScreenGestureCreateInput>
    src: string
    vh: string
    traceId: string
  }

  export type ScreenUpdateInput = {
    v?: IntFieldUpdateOperationsInput | number
    created?: DateTimeFieldUpdateOperationsInput | Date | string
    gesture?: XOR<ScreenGestureUpdateEnvelopeInput, ScreenGestureCreateInput>
    src?: StringFieldUpdateOperationsInput | string
    vh?: StringFieldUpdateOperationsInput | string
    trace?: TraceUpdateOneRequiredWithoutScreensNestedInput
  }

  export type ScreenUncheckedUpdateInput = {
    v?: IntFieldUpdateOperationsInput | number
    created?: DateTimeFieldUpdateOperationsInput | Date | string
    gesture?: XOR<ScreenGestureUpdateEnvelopeInput, ScreenGestureCreateInput>
    src?: StringFieldUpdateOperationsInput | string
    vh?: StringFieldUpdateOperationsInput | string
    traceId?: StringFieldUpdateOperationsInput | string
  }

  export type ScreenCreateManyInput = {
    id?: string
    v?: number
    created?: Date | string
    gesture: XOR<ScreenGestureCreateEnvelopeInput, ScreenGestureCreateInput>
    src: string
    vh: string
    traceId: string
  }

  export type ScreenUpdateManyMutationInput = {
    v?: IntFieldUpdateOperationsInput | number
    created?: DateTimeFieldUpdateOperationsInput | Date | string
    gesture?: XOR<ScreenGestureUpdateEnvelopeInput, ScreenGestureCreateInput>
    src?: StringFieldUpdateOperationsInput | string
    vh?: StringFieldUpdateOperationsInput | string
  }

  export type ScreenUncheckedUpdateManyInput = {
    v?: IntFieldUpdateOperationsInput | number
    created?: DateTimeFieldUpdateOperationsInput | Date | string
    gesture?: XOR<ScreenGestureUpdateEnvelopeInput, ScreenGestureCreateInput>
    src?: StringFieldUpdateOperationsInput | string
    vh?: StringFieldUpdateOperationsInput | string
    traceId?: StringFieldUpdateOperationsInput | string
  }

  export type TraceCreateInput = {
    id?: string
    v?: number
    appId: string
    created?: Date | string
    name?: string | null
    description: string
    screenIds?: TraceCreatescreenIdsInput | string[]
    worker: string
    screens?: ScreenCreateNestedManyWithoutTraceInput
    task?: TaskCreateNestedOneWithoutTracesInput
  }

  export type TraceUncheckedCreateInput = {
    id?: string
    v?: number
    appId: string
    created?: Date | string
    name?: string | null
    description: string
    screenIds?: TraceCreatescreenIdsInput | string[]
    taskId?: string | null
    worker: string
    screens?: ScreenUncheckedCreateNestedManyWithoutTraceInput
  }

  export type TraceUpdateInput = {
    v?: IntFieldUpdateOperationsInput | number
    appId?: StringFieldUpdateOperationsInput | string
    created?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    screenIds?: TraceUpdatescreenIdsInput | string[]
    worker?: StringFieldUpdateOperationsInput | string
    screens?: ScreenUpdateManyWithoutTraceNestedInput
    task?: TaskUpdateOneWithoutTracesNestedInput
  }

  export type TraceUncheckedUpdateInput = {
    v?: IntFieldUpdateOperationsInput | number
    appId?: StringFieldUpdateOperationsInput | string
    created?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    screenIds?: TraceUpdatescreenIdsInput | string[]
    taskId?: NullableStringFieldUpdateOperationsInput | string | null
    worker?: StringFieldUpdateOperationsInput | string
    screens?: ScreenUncheckedUpdateManyWithoutTraceNestedInput
  }

  export type TraceCreateManyInput = {
    id?: string
    v?: number
    appId: string
    created?: Date | string
    name?: string | null
    description: string
    screenIds?: TraceCreatescreenIdsInput | string[]
    taskId?: string | null
    worker: string
  }

  export type TraceUpdateManyMutationInput = {
    v?: IntFieldUpdateOperationsInput | number
    appId?: StringFieldUpdateOperationsInput | string
    created?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    screenIds?: TraceUpdatescreenIdsInput | string[]
    worker?: StringFieldUpdateOperationsInput | string
  }

  export type TraceUncheckedUpdateManyInput = {
    v?: IntFieldUpdateOperationsInput | number
    appId?: StringFieldUpdateOperationsInput | string
    created?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    screenIds?: TraceUpdatescreenIdsInput | string[]
    taskId?: NullableStringFieldUpdateOperationsInput | string | null
    worker?: StringFieldUpdateOperationsInput | string
  }

  export type UserCreateInput = {
    id?: string
    email: string
    name?: string | null
    role?: $Enums.Role
  }

  export type UserUncheckedCreateInput = {
    id?: string
    email: string
    name?: string | null
    role?: $Enums.Role
  }

  export type UserUpdateInput = {
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
  }

  export type UserUncheckedUpdateInput = {
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
  }

  export type UserCreateManyInput = {
    id?: string
    email: string
    name?: string | null
    role?: $Enums.Role
  }

  export type UserUpdateManyMutationInput = {
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
  }

  export type UserUncheckedUpdateManyInput = {
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
  }

  export type TaskCreateInput = {
    id?: string
    appId: string
    os: string
    traceIds?: TaskCreatetraceIdsInput | string[]
    description: string
    traces?: TraceCreateNestedManyWithoutTaskInput
    Capture?: CaptureCreateNestedManyWithoutTaskInput
  }

  export type TaskUncheckedCreateInput = {
    id?: string
    appId: string
    os: string
    traceIds?: TaskCreatetraceIdsInput | string[]
    description: string
    traces?: TraceUncheckedCreateNestedManyWithoutTaskInput
    Capture?: CaptureUncheckedCreateNestedManyWithoutTaskInput
  }

  export type TaskUpdateInput = {
    appId?: StringFieldUpdateOperationsInput | string
    os?: StringFieldUpdateOperationsInput | string
    traceIds?: TaskUpdatetraceIdsInput | string[]
    description?: StringFieldUpdateOperationsInput | string
    traces?: TraceUpdateManyWithoutTaskNestedInput
    Capture?: CaptureUpdateManyWithoutTaskNestedInput
  }

  export type TaskUncheckedUpdateInput = {
    appId?: StringFieldUpdateOperationsInput | string
    os?: StringFieldUpdateOperationsInput | string
    traceIds?: TaskUpdatetraceIdsInput | string[]
    description?: StringFieldUpdateOperationsInput | string
    traces?: TraceUncheckedUpdateManyWithoutTaskNestedInput
    Capture?: CaptureUncheckedUpdateManyWithoutTaskNestedInput
  }

  export type TaskCreateManyInput = {
    id?: string
    appId: string
    os: string
    traceIds?: TaskCreatetraceIdsInput | string[]
    description: string
  }

  export type TaskUpdateManyMutationInput = {
    appId?: StringFieldUpdateOperationsInput | string
    os?: StringFieldUpdateOperationsInput | string
    traceIds?: TaskUpdatetraceIdsInput | string[]
    description?: StringFieldUpdateOperationsInput | string
  }

  export type TaskUncheckedUpdateManyInput = {
    appId?: StringFieldUpdateOperationsInput | string
    os?: StringFieldUpdateOperationsInput | string
    traceIds?: TaskUpdatetraceIdsInput | string[]
    description?: StringFieldUpdateOperationsInput | string
  }

  export type CaptureCreateInput = {
    id?: string
    appId: string
    otp: string
    src: string
    app?: AppCreateNestedOneWithoutCaptureInput
    task: TaskCreateNestedOneWithoutCaptureInput
  }

  export type CaptureUncheckedCreateInput = {
    id?: string
    appId_?: string | null
    appId: string
    taskId: string
    otp: string
    src: string
  }

  export type CaptureUpdateInput = {
    appId?: StringFieldUpdateOperationsInput | string
    otp?: StringFieldUpdateOperationsInput | string
    src?: StringFieldUpdateOperationsInput | string
    app?: AppUpdateOneWithoutCaptureNestedInput
    task?: TaskUpdateOneRequiredWithoutCaptureNestedInput
  }

  export type CaptureUncheckedUpdateInput = {
    appId_?: NullableStringFieldUpdateOperationsInput | string | null
    appId?: StringFieldUpdateOperationsInput | string
    taskId?: StringFieldUpdateOperationsInput | string
    otp?: StringFieldUpdateOperationsInput | string
    src?: StringFieldUpdateOperationsInput | string
  }

  export type CaptureCreateManyInput = {
    id?: string
    appId_?: string | null
    appId: string
    taskId: string
    otp: string
    src: string
  }

  export type CaptureUpdateManyMutationInput = {
    appId?: StringFieldUpdateOperationsInput | string
    otp?: StringFieldUpdateOperationsInput | string
    src?: StringFieldUpdateOperationsInput | string
  }

  export type CaptureUncheckedUpdateManyInput = {
    appId_?: NullableStringFieldUpdateOperationsInput | string | null
    appId?: StringFieldUpdateOperationsInput | string
    taskId?: StringFieldUpdateOperationsInput | string
    otp?: StringFieldUpdateOperationsInput | string
    src?: StringFieldUpdateOperationsInput | string
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

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
    isSet?: boolean
  }

  export type AppsCategoryNullableCompositeFilter = {
    equals?: AppsCategoryObjectEqualityInput | null
    is?: AppsCategoryWhereInput | null
    isNot?: AppsCategoryWhereInput | null
    isSet?: boolean
  }

  export type AppsCategoryObjectEqualityInput = {
    id: string
    name: string
  }

  export type AppMetadataCompositeFilter = {
    equals?: AppMetadataObjectEqualityInput
    is?: AppMetadataWhereInput
    isNot?: AppMetadataWhereInput
  }

  export type AppMetadataObjectEqualityInput = {
    company: string
    name: string
    cover: string
    description: string
    icon: string
    rating: number
    reviews?: number | null
    genre?: string[]
    downloads: string
    url: string
  }

  export type CaptureListRelationFilter = {
    every?: CaptureWhereInput
    some?: CaptureWhereInput
    none?: CaptureWhereInput
  }

  export type AppsCategoryOrderByInput = {
    id?: SortOrder
    name?: SortOrder
  }

  export type AppMetadataOrderByInput = {
    company?: SortOrder
    name?: SortOrder
    cover?: SortOrder
    description?: SortOrder
    icon?: SortOrder
    rating?: SortOrder
    reviews?: SortOrder
    genre?: SortOrder
    downloads?: SortOrder
    url?: SortOrder
  }

  export type CaptureOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type AppCountOrderByAggregateInput = {
    id?: SortOrder
    v?: SortOrder
    packageName?: SortOrder
  }

  export type AppAvgOrderByAggregateInput = {
    v?: SortOrder
  }

  export type AppMaxOrderByAggregateInput = {
    id?: SortOrder
    v?: SortOrder
    packageName?: SortOrder
  }

  export type AppMinOrderByAggregateInput = {
    id?: SortOrder
    v?: SortOrder
    packageName?: SortOrder
  }

  export type AppSumOrderByAggregateInput = {
    v?: SortOrder
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
    isSet?: boolean
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

  export type RedactionCountOrderByAggregateInput = {
    id?: SortOrder
    v?: SortOrder
    label?: SortOrder
    screen?: SortOrder
  }

  export type RedactionAvgOrderByAggregateInput = {
    v?: SortOrder
  }

  export type RedactionMaxOrderByAggregateInput = {
    id?: SortOrder
    v?: SortOrder
    label?: SortOrder
    screen?: SortOrder
  }

  export type RedactionMinOrderByAggregateInput = {
    id?: SortOrder
    v?: SortOrder
    label?: SortOrder
    screen?: SortOrder
  }

  export type RedactionSumOrderByAggregateInput = {
    v?: SortOrder
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

  export type ScreenGestureCompositeFilter = {
    equals?: ScreenGestureObjectEqualityInput
    is?: ScreenGestureWhereInput
    isNot?: ScreenGestureWhereInput
  }

  export type ScreenGestureObjectEqualityInput = {
    type?: string | null
    scrollDeltaX?: number | null
    scrollDeltaY?: number | null
    x?: number | null
    y?: number | null
    description?: string | null
  }

  export type TraceScalarRelationFilter = {
    is?: TraceWhereInput
    isNot?: TraceWhereInput
  }

  export type ScreenGestureOrderByInput = {
    type?: SortOrder
    scrollDeltaX?: SortOrder
    scrollDeltaY?: SortOrder
    x?: SortOrder
    y?: SortOrder
    description?: SortOrder
  }

  export type ScreenCountOrderByAggregateInput = {
    id?: SortOrder
    v?: SortOrder
    created?: SortOrder
    src?: SortOrder
    vh?: SortOrder
    traceId?: SortOrder
  }

  export type ScreenAvgOrderByAggregateInput = {
    v?: SortOrder
  }

  export type ScreenMaxOrderByAggregateInput = {
    id?: SortOrder
    v?: SortOrder
    created?: SortOrder
    src?: SortOrder
    vh?: SortOrder
    traceId?: SortOrder
  }

  export type ScreenMinOrderByAggregateInput = {
    id?: SortOrder
    v?: SortOrder
    created?: SortOrder
    src?: SortOrder
    vh?: SortOrder
    traceId?: SortOrder
  }

  export type ScreenSumOrderByAggregateInput = {
    v?: SortOrder
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
    isSet?: boolean
  }

  export type StringNullableListFilter<$PrismaModel = never> = {
    equals?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    has?: string | StringFieldRefInput<$PrismaModel> | null
    hasEvery?: string[] | ListStringFieldRefInput<$PrismaModel>
    hasSome?: string[] | ListStringFieldRefInput<$PrismaModel>
    isEmpty?: boolean
  }

  export type ScreenListRelationFilter = {
    every?: ScreenWhereInput
    some?: ScreenWhereInput
    none?: ScreenWhereInput
  }

  export type TaskNullableScalarRelationFilter = {
    is?: TaskWhereInput | null
    isNot?: TaskWhereInput | null
  }

  export type ScreenOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TraceCountOrderByAggregateInput = {
    id?: SortOrder
    v?: SortOrder
    appId?: SortOrder
    created?: SortOrder
    name?: SortOrder
    description?: SortOrder
    screenIds?: SortOrder
    taskId?: SortOrder
    worker?: SortOrder
  }

  export type TraceAvgOrderByAggregateInput = {
    v?: SortOrder
  }

  export type TraceMaxOrderByAggregateInput = {
    id?: SortOrder
    v?: SortOrder
    appId?: SortOrder
    created?: SortOrder
    name?: SortOrder
    description?: SortOrder
    taskId?: SortOrder
    worker?: SortOrder
  }

  export type TraceMinOrderByAggregateInput = {
    id?: SortOrder
    v?: SortOrder
    appId?: SortOrder
    created?: SortOrder
    name?: SortOrder
    description?: SortOrder
    taskId?: SortOrder
    worker?: SortOrder
  }

  export type TraceSumOrderByAggregateInput = {
    v?: SortOrder
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
    isSet?: boolean
  }

  export type EnumRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleFilter<$PrismaModel> | $Enums.Role
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
    role?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
    role?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
    role?: SortOrder
  }

  export type EnumRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleWithAggregatesFilter<$PrismaModel> | $Enums.Role
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRoleFilter<$PrismaModel>
    _max?: NestedEnumRoleFilter<$PrismaModel>
  }

  export type TraceListRelationFilter = {
    every?: TraceWhereInput
    some?: TraceWhereInput
    none?: TraceWhereInput
  }

  export type TraceOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TaskCountOrderByAggregateInput = {
    id?: SortOrder
    appId?: SortOrder
    os?: SortOrder
    traceIds?: SortOrder
    description?: SortOrder
  }

  export type TaskMaxOrderByAggregateInput = {
    id?: SortOrder
    appId?: SortOrder
    os?: SortOrder
    description?: SortOrder
  }

  export type TaskMinOrderByAggregateInput = {
    id?: SortOrder
    appId?: SortOrder
    os?: SortOrder
    description?: SortOrder
  }

  export type AppNullableScalarRelationFilter = {
    is?: AppWhereInput | null
    isNot?: AppWhereInput | null
  }

  export type TaskScalarRelationFilter = {
    is?: TaskWhereInput
    isNot?: TaskWhereInput
  }

  export type CaptureCountOrderByAggregateInput = {
    id?: SortOrder
    appId_?: SortOrder
    appId?: SortOrder
    taskId?: SortOrder
    otp?: SortOrder
    src?: SortOrder
  }

  export type CaptureMaxOrderByAggregateInput = {
    id?: SortOrder
    appId_?: SortOrder
    appId?: SortOrder
    taskId?: SortOrder
    otp?: SortOrder
    src?: SortOrder
  }

  export type CaptureMinOrderByAggregateInput = {
    id?: SortOrder
    appId_?: SortOrder
    appId?: SortOrder
    taskId?: SortOrder
    otp?: SortOrder
    src?: SortOrder
  }

  export type AppsCategoryNullableCreateEnvelopeInput = {
    set?: AppsCategoryCreateInput | null
  }

  export type AppsCategoryCreateInput = {
    id: string
    name: string
  }

  export type AppMetadataCreateEnvelopeInput = {
    set?: AppMetadataCreateInput
  }

  export type AppMetadataCreateInput = {
    company: string
    name: string
    cover: string
    description: string
    icon: string
    rating: number
    reviews?: number | null
    genre?: AppMetadataCreategenreInput | string[]
    downloads: string
    url: string
  }

  export type CaptureCreateNestedManyWithoutAppInput = {
    create?: XOR<CaptureCreateWithoutAppInput, CaptureUncheckedCreateWithoutAppInput> | CaptureCreateWithoutAppInput[] | CaptureUncheckedCreateWithoutAppInput[]
    connectOrCreate?: CaptureCreateOrConnectWithoutAppInput | CaptureCreateOrConnectWithoutAppInput[]
    createMany?: CaptureCreateManyAppInputEnvelope
    connect?: CaptureWhereUniqueInput | CaptureWhereUniqueInput[]
  }

  export type CaptureUncheckedCreateNestedManyWithoutAppInput = {
    create?: XOR<CaptureCreateWithoutAppInput, CaptureUncheckedCreateWithoutAppInput> | CaptureCreateWithoutAppInput[] | CaptureUncheckedCreateWithoutAppInput[]
    connectOrCreate?: CaptureCreateOrConnectWithoutAppInput | CaptureCreateOrConnectWithoutAppInput[]
    createMany?: CaptureCreateManyAppInputEnvelope
    connect?: CaptureWhereUniqueInput | CaptureWhereUniqueInput[]
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
    unset?: boolean
  }

  export type AppsCategoryNullableUpdateEnvelopeInput = {
    set?: AppsCategoryCreateInput | null
    upsert?: AppsCategoryUpsertInput
    unset?: boolean
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type AppMetadataUpdateEnvelopeInput = {
    set?: AppMetadataCreateInput
    update?: AppMetadataUpdateInput
  }

  export type CaptureUpdateManyWithoutAppNestedInput = {
    create?: XOR<CaptureCreateWithoutAppInput, CaptureUncheckedCreateWithoutAppInput> | CaptureCreateWithoutAppInput[] | CaptureUncheckedCreateWithoutAppInput[]
    connectOrCreate?: CaptureCreateOrConnectWithoutAppInput | CaptureCreateOrConnectWithoutAppInput[]
    upsert?: CaptureUpsertWithWhereUniqueWithoutAppInput | CaptureUpsertWithWhereUniqueWithoutAppInput[]
    createMany?: CaptureCreateManyAppInputEnvelope
    set?: CaptureWhereUniqueInput | CaptureWhereUniqueInput[]
    disconnect?: CaptureWhereUniqueInput | CaptureWhereUniqueInput[]
    delete?: CaptureWhereUniqueInput | CaptureWhereUniqueInput[]
    connect?: CaptureWhereUniqueInput | CaptureWhereUniqueInput[]
    update?: CaptureUpdateWithWhereUniqueWithoutAppInput | CaptureUpdateWithWhereUniqueWithoutAppInput[]
    updateMany?: CaptureUpdateManyWithWhereWithoutAppInput | CaptureUpdateManyWithWhereWithoutAppInput[]
    deleteMany?: CaptureScalarWhereInput | CaptureScalarWhereInput[]
  }

  export type CaptureUncheckedUpdateManyWithoutAppNestedInput = {
    create?: XOR<CaptureCreateWithoutAppInput, CaptureUncheckedCreateWithoutAppInput> | CaptureCreateWithoutAppInput[] | CaptureUncheckedCreateWithoutAppInput[]
    connectOrCreate?: CaptureCreateOrConnectWithoutAppInput | CaptureCreateOrConnectWithoutAppInput[]
    upsert?: CaptureUpsertWithWhereUniqueWithoutAppInput | CaptureUpsertWithWhereUniqueWithoutAppInput[]
    createMany?: CaptureCreateManyAppInputEnvelope
    set?: CaptureWhereUniqueInput | CaptureWhereUniqueInput[]
    disconnect?: CaptureWhereUniqueInput | CaptureWhereUniqueInput[]
    delete?: CaptureWhereUniqueInput | CaptureWhereUniqueInput[]
    connect?: CaptureWhereUniqueInput | CaptureWhereUniqueInput[]
    update?: CaptureUpdateWithWhereUniqueWithoutAppInput | CaptureUpdateWithWhereUniqueWithoutAppInput[]
    updateMany?: CaptureUpdateManyWithWhereWithoutAppInput | CaptureUpdateManyWithWhereWithoutAppInput[]
    deleteMany?: CaptureScalarWhereInput | CaptureScalarWhereInput[]
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type ScreenGestureCreateEnvelopeInput = {
    set?: ScreenGestureCreateInput
  }

  export type ScreenGestureCreateInput = {
    type?: string | null
    scrollDeltaX?: number | null
    scrollDeltaY?: number | null
    x?: number | null
    y?: number | null
    description?: string | null
  }

  export type TraceCreateNestedOneWithoutScreensInput = {
    create?: XOR<TraceCreateWithoutScreensInput, TraceUncheckedCreateWithoutScreensInput>
    connectOrCreate?: TraceCreateOrConnectWithoutScreensInput
    connect?: TraceWhereUniqueInput
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type ScreenGestureUpdateEnvelopeInput = {
    set?: ScreenGestureCreateInput
    update?: ScreenGestureUpdateInput
  }

  export type TraceUpdateOneRequiredWithoutScreensNestedInput = {
    create?: XOR<TraceCreateWithoutScreensInput, TraceUncheckedCreateWithoutScreensInput>
    connectOrCreate?: TraceCreateOrConnectWithoutScreensInput
    upsert?: TraceUpsertWithoutScreensInput
    connect?: TraceWhereUniqueInput
    update?: XOR<XOR<TraceUpdateToOneWithWhereWithoutScreensInput, TraceUpdateWithoutScreensInput>, TraceUncheckedUpdateWithoutScreensInput>
  }

  export type TraceCreatescreenIdsInput = {
    set: string[]
  }

  export type ScreenCreateNestedManyWithoutTraceInput = {
    create?: XOR<ScreenCreateWithoutTraceInput, ScreenUncheckedCreateWithoutTraceInput> | ScreenCreateWithoutTraceInput[] | ScreenUncheckedCreateWithoutTraceInput[]
    connectOrCreate?: ScreenCreateOrConnectWithoutTraceInput | ScreenCreateOrConnectWithoutTraceInput[]
    createMany?: ScreenCreateManyTraceInputEnvelope
    connect?: ScreenWhereUniqueInput | ScreenWhereUniqueInput[]
  }

  export type TaskCreateNestedOneWithoutTracesInput = {
    create?: XOR<TaskCreateWithoutTracesInput, TaskUncheckedCreateWithoutTracesInput>
    connectOrCreate?: TaskCreateOrConnectWithoutTracesInput
    connect?: TaskWhereUniqueInput
  }

  export type ScreenUncheckedCreateNestedManyWithoutTraceInput = {
    create?: XOR<ScreenCreateWithoutTraceInput, ScreenUncheckedCreateWithoutTraceInput> | ScreenCreateWithoutTraceInput[] | ScreenUncheckedCreateWithoutTraceInput[]
    connectOrCreate?: ScreenCreateOrConnectWithoutTraceInput | ScreenCreateOrConnectWithoutTraceInput[]
    createMany?: ScreenCreateManyTraceInputEnvelope
    connect?: ScreenWhereUniqueInput | ScreenWhereUniqueInput[]
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
    unset?: boolean
  }

  export type TraceUpdatescreenIdsInput = {
    set?: string[]
    push?: string | string[]
  }

  export type ScreenUpdateManyWithoutTraceNestedInput = {
    create?: XOR<ScreenCreateWithoutTraceInput, ScreenUncheckedCreateWithoutTraceInput> | ScreenCreateWithoutTraceInput[] | ScreenUncheckedCreateWithoutTraceInput[]
    connectOrCreate?: ScreenCreateOrConnectWithoutTraceInput | ScreenCreateOrConnectWithoutTraceInput[]
    upsert?: ScreenUpsertWithWhereUniqueWithoutTraceInput | ScreenUpsertWithWhereUniqueWithoutTraceInput[]
    createMany?: ScreenCreateManyTraceInputEnvelope
    set?: ScreenWhereUniqueInput | ScreenWhereUniqueInput[]
    disconnect?: ScreenWhereUniqueInput | ScreenWhereUniqueInput[]
    delete?: ScreenWhereUniqueInput | ScreenWhereUniqueInput[]
    connect?: ScreenWhereUniqueInput | ScreenWhereUniqueInput[]
    update?: ScreenUpdateWithWhereUniqueWithoutTraceInput | ScreenUpdateWithWhereUniqueWithoutTraceInput[]
    updateMany?: ScreenUpdateManyWithWhereWithoutTraceInput | ScreenUpdateManyWithWhereWithoutTraceInput[]
    deleteMany?: ScreenScalarWhereInput | ScreenScalarWhereInput[]
  }

  export type TaskUpdateOneWithoutTracesNestedInput = {
    create?: XOR<TaskCreateWithoutTracesInput, TaskUncheckedCreateWithoutTracesInput>
    connectOrCreate?: TaskCreateOrConnectWithoutTracesInput
    upsert?: TaskUpsertWithoutTracesInput
    disconnect?: boolean
    delete?: TaskWhereInput | boolean
    connect?: TaskWhereUniqueInput
    update?: XOR<XOR<TaskUpdateToOneWithWhereWithoutTracesInput, TaskUpdateWithoutTracesInput>, TaskUncheckedUpdateWithoutTracesInput>
  }

  export type ScreenUncheckedUpdateManyWithoutTraceNestedInput = {
    create?: XOR<ScreenCreateWithoutTraceInput, ScreenUncheckedCreateWithoutTraceInput> | ScreenCreateWithoutTraceInput[] | ScreenUncheckedCreateWithoutTraceInput[]
    connectOrCreate?: ScreenCreateOrConnectWithoutTraceInput | ScreenCreateOrConnectWithoutTraceInput[]
    upsert?: ScreenUpsertWithWhereUniqueWithoutTraceInput | ScreenUpsertWithWhereUniqueWithoutTraceInput[]
    createMany?: ScreenCreateManyTraceInputEnvelope
    set?: ScreenWhereUniqueInput | ScreenWhereUniqueInput[]
    disconnect?: ScreenWhereUniqueInput | ScreenWhereUniqueInput[]
    delete?: ScreenWhereUniqueInput | ScreenWhereUniqueInput[]
    connect?: ScreenWhereUniqueInput | ScreenWhereUniqueInput[]
    update?: ScreenUpdateWithWhereUniqueWithoutTraceInput | ScreenUpdateWithWhereUniqueWithoutTraceInput[]
    updateMany?: ScreenUpdateManyWithWhereWithoutTraceInput | ScreenUpdateManyWithWhereWithoutTraceInput[]
    deleteMany?: ScreenScalarWhereInput | ScreenScalarWhereInput[]
  }

  export type EnumRoleFieldUpdateOperationsInput = {
    set?: $Enums.Role
  }

  export type TaskCreatetraceIdsInput = {
    set: string[]
  }

  export type TraceCreateNestedManyWithoutTaskInput = {
    create?: XOR<TraceCreateWithoutTaskInput, TraceUncheckedCreateWithoutTaskInput> | TraceCreateWithoutTaskInput[] | TraceUncheckedCreateWithoutTaskInput[]
    connectOrCreate?: TraceCreateOrConnectWithoutTaskInput | TraceCreateOrConnectWithoutTaskInput[]
    createMany?: TraceCreateManyTaskInputEnvelope
    connect?: TraceWhereUniqueInput | TraceWhereUniqueInput[]
  }

  export type CaptureCreateNestedManyWithoutTaskInput = {
    create?: XOR<CaptureCreateWithoutTaskInput, CaptureUncheckedCreateWithoutTaskInput> | CaptureCreateWithoutTaskInput[] | CaptureUncheckedCreateWithoutTaskInput[]
    connectOrCreate?: CaptureCreateOrConnectWithoutTaskInput | CaptureCreateOrConnectWithoutTaskInput[]
    createMany?: CaptureCreateManyTaskInputEnvelope
    connect?: CaptureWhereUniqueInput | CaptureWhereUniqueInput[]
  }

  export type TraceUncheckedCreateNestedManyWithoutTaskInput = {
    create?: XOR<TraceCreateWithoutTaskInput, TraceUncheckedCreateWithoutTaskInput> | TraceCreateWithoutTaskInput[] | TraceUncheckedCreateWithoutTaskInput[]
    connectOrCreate?: TraceCreateOrConnectWithoutTaskInput | TraceCreateOrConnectWithoutTaskInput[]
    createMany?: TraceCreateManyTaskInputEnvelope
    connect?: TraceWhereUniqueInput | TraceWhereUniqueInput[]
  }

  export type CaptureUncheckedCreateNestedManyWithoutTaskInput = {
    create?: XOR<CaptureCreateWithoutTaskInput, CaptureUncheckedCreateWithoutTaskInput> | CaptureCreateWithoutTaskInput[] | CaptureUncheckedCreateWithoutTaskInput[]
    connectOrCreate?: CaptureCreateOrConnectWithoutTaskInput | CaptureCreateOrConnectWithoutTaskInput[]
    createMany?: CaptureCreateManyTaskInputEnvelope
    connect?: CaptureWhereUniqueInput | CaptureWhereUniqueInput[]
  }

  export type TaskUpdatetraceIdsInput = {
    set?: string[]
    push?: string | string[]
  }

  export type TraceUpdateManyWithoutTaskNestedInput = {
    create?: XOR<TraceCreateWithoutTaskInput, TraceUncheckedCreateWithoutTaskInput> | TraceCreateWithoutTaskInput[] | TraceUncheckedCreateWithoutTaskInput[]
    connectOrCreate?: TraceCreateOrConnectWithoutTaskInput | TraceCreateOrConnectWithoutTaskInput[]
    upsert?: TraceUpsertWithWhereUniqueWithoutTaskInput | TraceUpsertWithWhereUniqueWithoutTaskInput[]
    createMany?: TraceCreateManyTaskInputEnvelope
    set?: TraceWhereUniqueInput | TraceWhereUniqueInput[]
    disconnect?: TraceWhereUniqueInput | TraceWhereUniqueInput[]
    delete?: TraceWhereUniqueInput | TraceWhereUniqueInput[]
    connect?: TraceWhereUniqueInput | TraceWhereUniqueInput[]
    update?: TraceUpdateWithWhereUniqueWithoutTaskInput | TraceUpdateWithWhereUniqueWithoutTaskInput[]
    updateMany?: TraceUpdateManyWithWhereWithoutTaskInput | TraceUpdateManyWithWhereWithoutTaskInput[]
    deleteMany?: TraceScalarWhereInput | TraceScalarWhereInput[]
  }

  export type CaptureUpdateManyWithoutTaskNestedInput = {
    create?: XOR<CaptureCreateWithoutTaskInput, CaptureUncheckedCreateWithoutTaskInput> | CaptureCreateWithoutTaskInput[] | CaptureUncheckedCreateWithoutTaskInput[]
    connectOrCreate?: CaptureCreateOrConnectWithoutTaskInput | CaptureCreateOrConnectWithoutTaskInput[]
    upsert?: CaptureUpsertWithWhereUniqueWithoutTaskInput | CaptureUpsertWithWhereUniqueWithoutTaskInput[]
    createMany?: CaptureCreateManyTaskInputEnvelope
    set?: CaptureWhereUniqueInput | CaptureWhereUniqueInput[]
    disconnect?: CaptureWhereUniqueInput | CaptureWhereUniqueInput[]
    delete?: CaptureWhereUniqueInput | CaptureWhereUniqueInput[]
    connect?: CaptureWhereUniqueInput | CaptureWhereUniqueInput[]
    update?: CaptureUpdateWithWhereUniqueWithoutTaskInput | CaptureUpdateWithWhereUniqueWithoutTaskInput[]
    updateMany?: CaptureUpdateManyWithWhereWithoutTaskInput | CaptureUpdateManyWithWhereWithoutTaskInput[]
    deleteMany?: CaptureScalarWhereInput | CaptureScalarWhereInput[]
  }

  export type TraceUncheckedUpdateManyWithoutTaskNestedInput = {
    create?: XOR<TraceCreateWithoutTaskInput, TraceUncheckedCreateWithoutTaskInput> | TraceCreateWithoutTaskInput[] | TraceUncheckedCreateWithoutTaskInput[]
    connectOrCreate?: TraceCreateOrConnectWithoutTaskInput | TraceCreateOrConnectWithoutTaskInput[]
    upsert?: TraceUpsertWithWhereUniqueWithoutTaskInput | TraceUpsertWithWhereUniqueWithoutTaskInput[]
    createMany?: TraceCreateManyTaskInputEnvelope
    set?: TraceWhereUniqueInput | TraceWhereUniqueInput[]
    disconnect?: TraceWhereUniqueInput | TraceWhereUniqueInput[]
    delete?: TraceWhereUniqueInput | TraceWhereUniqueInput[]
    connect?: TraceWhereUniqueInput | TraceWhereUniqueInput[]
    update?: TraceUpdateWithWhereUniqueWithoutTaskInput | TraceUpdateWithWhereUniqueWithoutTaskInput[]
    updateMany?: TraceUpdateManyWithWhereWithoutTaskInput | TraceUpdateManyWithWhereWithoutTaskInput[]
    deleteMany?: TraceScalarWhereInput | TraceScalarWhereInput[]
  }

  export type CaptureUncheckedUpdateManyWithoutTaskNestedInput = {
    create?: XOR<CaptureCreateWithoutTaskInput, CaptureUncheckedCreateWithoutTaskInput> | CaptureCreateWithoutTaskInput[] | CaptureUncheckedCreateWithoutTaskInput[]
    connectOrCreate?: CaptureCreateOrConnectWithoutTaskInput | CaptureCreateOrConnectWithoutTaskInput[]
    upsert?: CaptureUpsertWithWhereUniqueWithoutTaskInput | CaptureUpsertWithWhereUniqueWithoutTaskInput[]
    createMany?: CaptureCreateManyTaskInputEnvelope
    set?: CaptureWhereUniqueInput | CaptureWhereUniqueInput[]
    disconnect?: CaptureWhereUniqueInput | CaptureWhereUniqueInput[]
    delete?: CaptureWhereUniqueInput | CaptureWhereUniqueInput[]
    connect?: CaptureWhereUniqueInput | CaptureWhereUniqueInput[]
    update?: CaptureUpdateWithWhereUniqueWithoutTaskInput | CaptureUpdateWithWhereUniqueWithoutTaskInput[]
    updateMany?: CaptureUpdateManyWithWhereWithoutTaskInput | CaptureUpdateManyWithWhereWithoutTaskInput[]
    deleteMany?: CaptureScalarWhereInput | CaptureScalarWhereInput[]
  }

  export type AppCreateNestedOneWithoutCaptureInput = {
    create?: XOR<AppCreateWithoutCaptureInput, AppUncheckedCreateWithoutCaptureInput>
    connectOrCreate?: AppCreateOrConnectWithoutCaptureInput
    connect?: AppWhereUniqueInput
  }

  export type TaskCreateNestedOneWithoutCaptureInput = {
    create?: XOR<TaskCreateWithoutCaptureInput, TaskUncheckedCreateWithoutCaptureInput>
    connectOrCreate?: TaskCreateOrConnectWithoutCaptureInput
    connect?: TaskWhereUniqueInput
  }

  export type AppUpdateOneWithoutCaptureNestedInput = {
    create?: XOR<AppCreateWithoutCaptureInput, AppUncheckedCreateWithoutCaptureInput>
    connectOrCreate?: AppCreateOrConnectWithoutCaptureInput
    upsert?: AppUpsertWithoutCaptureInput
    disconnect?: boolean
    delete?: AppWhereInput | boolean
    connect?: AppWhereUniqueInput
    update?: XOR<XOR<AppUpdateToOneWithWhereWithoutCaptureInput, AppUpdateWithoutCaptureInput>, AppUncheckedUpdateWithoutCaptureInput>
  }

  export type TaskUpdateOneRequiredWithoutCaptureNestedInput = {
    create?: XOR<TaskCreateWithoutCaptureInput, TaskUncheckedCreateWithoutCaptureInput>
    connectOrCreate?: TaskCreateOrConnectWithoutCaptureInput
    upsert?: TaskUpsertWithoutCaptureInput
    connect?: TaskWhereUniqueInput
    update?: XOR<XOR<TaskUpdateToOneWithWhereWithoutCaptureInput, TaskUpdateWithoutCaptureInput>, TaskUncheckedUpdateWithoutCaptureInput>
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

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
    isSet?: boolean
  }

  export type AppsCategoryWhereInput = {
    AND?: AppsCategoryWhereInput | AppsCategoryWhereInput[]
    OR?: AppsCategoryWhereInput[]
    NOT?: AppsCategoryWhereInput | AppsCategoryWhereInput[]
    id?: StringFilter<"AppsCategory"> | string
    name?: StringFilter<"AppsCategory"> | string
  }

  export type AppMetadataWhereInput = {
    AND?: AppMetadataWhereInput | AppMetadataWhereInput[]
    OR?: AppMetadataWhereInput[]
    NOT?: AppMetadataWhereInput | AppMetadataWhereInput[]
    company?: StringFilter<"AppMetadata"> | string
    name?: StringFilter<"AppMetadata"> | string
    cover?: StringFilter<"AppMetadata"> | string
    description?: StringFilter<"AppMetadata"> | string
    icon?: StringFilter<"AppMetadata"> | string
    rating?: FloatFilter<"AppMetadata"> | number
    reviews?: FloatNullableFilter<"AppMetadata"> | number | null
    genre?: StringNullableListFilter<"AppMetadata">
    downloads?: StringFilter<"AppMetadata"> | string
    url?: StringFilter<"AppMetadata"> | string
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
    isSet?: boolean
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
    isSet?: boolean
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

  export type ScreenGestureWhereInput = {
    AND?: ScreenGestureWhereInput | ScreenGestureWhereInput[]
    OR?: ScreenGestureWhereInput[]
    NOT?: ScreenGestureWhereInput | ScreenGestureWhereInput[]
    type?: StringNullableFilter<"ScreenGesture"> | string | null
    scrollDeltaX?: FloatNullableFilter<"ScreenGesture"> | number | null
    scrollDeltaY?: FloatNullableFilter<"ScreenGesture"> | number | null
    x?: FloatNullableFilter<"ScreenGesture"> | number | null
    y?: FloatNullableFilter<"ScreenGesture"> | number | null
    description?: StringNullableFilter<"ScreenGesture"> | string | null
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
    isSet?: boolean
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
    isSet?: boolean
  }

  export type NestedEnumRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleFilter<$PrismaModel> | $Enums.Role
  }

  export type NestedEnumRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleWithAggregatesFilter<$PrismaModel> | $Enums.Role
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRoleFilter<$PrismaModel>
    _max?: NestedEnumRoleFilter<$PrismaModel>
  }

  export type AppMetadataCreategenreInput = {
    set: string[]
  }

  export type CaptureCreateWithoutAppInput = {
    id?: string
    appId: string
    otp: string
    src: string
    task: TaskCreateNestedOneWithoutCaptureInput
  }

  export type CaptureUncheckedCreateWithoutAppInput = {
    id?: string
    appId: string
    taskId: string
    otp: string
    src: string
  }

  export type CaptureCreateOrConnectWithoutAppInput = {
    where: CaptureWhereUniqueInput
    create: XOR<CaptureCreateWithoutAppInput, CaptureUncheckedCreateWithoutAppInput>
  }

  export type CaptureCreateManyAppInputEnvelope = {
    data: CaptureCreateManyAppInput | CaptureCreateManyAppInput[]
  }

  export type AppsCategoryUpsertInput = {
    set: AppsCategoryCreateInput | null
    update: AppsCategoryUpdateInput
  }

  export type AppMetadataUpdateInput = {
    company?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    cover?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    icon?: StringFieldUpdateOperationsInput | string
    rating?: FloatFieldUpdateOperationsInput | number
    reviews?: NullableFloatFieldUpdateOperationsInput | number | null
    genre?: AppMetadataUpdategenreInput | string[]
    downloads?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
  }

  export type CaptureUpsertWithWhereUniqueWithoutAppInput = {
    where: CaptureWhereUniqueInput
    update: XOR<CaptureUpdateWithoutAppInput, CaptureUncheckedUpdateWithoutAppInput>
    create: XOR<CaptureCreateWithoutAppInput, CaptureUncheckedCreateWithoutAppInput>
  }

  export type CaptureUpdateWithWhereUniqueWithoutAppInput = {
    where: CaptureWhereUniqueInput
    data: XOR<CaptureUpdateWithoutAppInput, CaptureUncheckedUpdateWithoutAppInput>
  }

  export type CaptureUpdateManyWithWhereWithoutAppInput = {
    where: CaptureScalarWhereInput
    data: XOR<CaptureUpdateManyMutationInput, CaptureUncheckedUpdateManyWithoutAppInput>
  }

  export type CaptureScalarWhereInput = {
    AND?: CaptureScalarWhereInput | CaptureScalarWhereInput[]
    OR?: CaptureScalarWhereInput[]
    NOT?: CaptureScalarWhereInput | CaptureScalarWhereInput[]
    id?: StringFilter<"Capture"> | string
    appId_?: StringNullableFilter<"Capture"> | string | null
    appId?: StringFilter<"Capture"> | string
    taskId?: StringFilter<"Capture"> | string
    otp?: StringFilter<"Capture"> | string
    src?: StringFilter<"Capture"> | string
  }

  export type TraceCreateWithoutScreensInput = {
    id?: string
    v?: number
    appId: string
    created?: Date | string
    name?: string | null
    description: string
    screenIds?: TraceCreatescreenIdsInput | string[]
    worker: string
    task?: TaskCreateNestedOneWithoutTracesInput
  }

  export type TraceUncheckedCreateWithoutScreensInput = {
    id?: string
    v?: number
    appId: string
    created?: Date | string
    name?: string | null
    description: string
    screenIds?: TraceCreatescreenIdsInput | string[]
    taskId?: string | null
    worker: string
  }

  export type TraceCreateOrConnectWithoutScreensInput = {
    where: TraceWhereUniqueInput
    create: XOR<TraceCreateWithoutScreensInput, TraceUncheckedCreateWithoutScreensInput>
  }

  export type ScreenGestureUpdateInput = {
    type?: NullableStringFieldUpdateOperationsInput | string | null
    scrollDeltaX?: NullableFloatFieldUpdateOperationsInput | number | null
    scrollDeltaY?: NullableFloatFieldUpdateOperationsInput | number | null
    x?: NullableFloatFieldUpdateOperationsInput | number | null
    y?: NullableFloatFieldUpdateOperationsInput | number | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type TraceUpsertWithoutScreensInput = {
    update: XOR<TraceUpdateWithoutScreensInput, TraceUncheckedUpdateWithoutScreensInput>
    create: XOR<TraceCreateWithoutScreensInput, TraceUncheckedCreateWithoutScreensInput>
    where?: TraceWhereInput
  }

  export type TraceUpdateToOneWithWhereWithoutScreensInput = {
    where?: TraceWhereInput
    data: XOR<TraceUpdateWithoutScreensInput, TraceUncheckedUpdateWithoutScreensInput>
  }

  export type TraceUpdateWithoutScreensInput = {
    v?: IntFieldUpdateOperationsInput | number
    appId?: StringFieldUpdateOperationsInput | string
    created?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    screenIds?: TraceUpdatescreenIdsInput | string[]
    worker?: StringFieldUpdateOperationsInput | string
    task?: TaskUpdateOneWithoutTracesNestedInput
  }

  export type TraceUncheckedUpdateWithoutScreensInput = {
    v?: IntFieldUpdateOperationsInput | number
    appId?: StringFieldUpdateOperationsInput | string
    created?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    screenIds?: TraceUpdatescreenIdsInput | string[]
    taskId?: NullableStringFieldUpdateOperationsInput | string | null
    worker?: StringFieldUpdateOperationsInput | string
  }

  export type ScreenCreateWithoutTraceInput = {
    id?: string
    v?: number
    created?: Date | string
    gesture: XOR<ScreenGestureCreateEnvelopeInput, ScreenGestureCreateInput>
    src: string
    vh: string
  }

  export type ScreenUncheckedCreateWithoutTraceInput = {
    id?: string
    v?: number
    created?: Date | string
    gesture: XOR<ScreenGestureCreateEnvelopeInput, ScreenGestureCreateInput>
    src: string
    vh: string
  }

  export type ScreenCreateOrConnectWithoutTraceInput = {
    where: ScreenWhereUniqueInput
    create: XOR<ScreenCreateWithoutTraceInput, ScreenUncheckedCreateWithoutTraceInput>
  }

  export type ScreenCreateManyTraceInputEnvelope = {
    data: ScreenCreateManyTraceInput | ScreenCreateManyTraceInput[]
  }

  export type TaskCreateWithoutTracesInput = {
    id?: string
    appId: string
    os: string
    traceIds?: TaskCreatetraceIdsInput | string[]
    description: string
    Capture?: CaptureCreateNestedManyWithoutTaskInput
  }

  export type TaskUncheckedCreateWithoutTracesInput = {
    id?: string
    appId: string
    os: string
    traceIds?: TaskCreatetraceIdsInput | string[]
    description: string
    Capture?: CaptureUncheckedCreateNestedManyWithoutTaskInput
  }

  export type TaskCreateOrConnectWithoutTracesInput = {
    where: TaskWhereUniqueInput
    create: XOR<TaskCreateWithoutTracesInput, TaskUncheckedCreateWithoutTracesInput>
  }

  export type ScreenUpsertWithWhereUniqueWithoutTraceInput = {
    where: ScreenWhereUniqueInput
    update: XOR<ScreenUpdateWithoutTraceInput, ScreenUncheckedUpdateWithoutTraceInput>
    create: XOR<ScreenCreateWithoutTraceInput, ScreenUncheckedCreateWithoutTraceInput>
  }

  export type ScreenUpdateWithWhereUniqueWithoutTraceInput = {
    where: ScreenWhereUniqueInput
    data: XOR<ScreenUpdateWithoutTraceInput, ScreenUncheckedUpdateWithoutTraceInput>
  }

  export type ScreenUpdateManyWithWhereWithoutTraceInput = {
    where: ScreenScalarWhereInput
    data: XOR<ScreenUpdateManyMutationInput, ScreenUncheckedUpdateManyWithoutTraceInput>
  }

  export type ScreenScalarWhereInput = {
    AND?: ScreenScalarWhereInput | ScreenScalarWhereInput[]
    OR?: ScreenScalarWhereInput[]
    NOT?: ScreenScalarWhereInput | ScreenScalarWhereInput[]
    id?: StringFilter<"Screen"> | string
    v?: IntFilter<"Screen"> | number
    created?: DateTimeFilter<"Screen"> | Date | string
    src?: StringFilter<"Screen"> | string
    vh?: StringFilter<"Screen"> | string
    traceId?: StringFilter<"Screen"> | string
  }

  export type TaskUpsertWithoutTracesInput = {
    update: XOR<TaskUpdateWithoutTracesInput, TaskUncheckedUpdateWithoutTracesInput>
    create: XOR<TaskCreateWithoutTracesInput, TaskUncheckedCreateWithoutTracesInput>
    where?: TaskWhereInput
  }

  export type TaskUpdateToOneWithWhereWithoutTracesInput = {
    where?: TaskWhereInput
    data: XOR<TaskUpdateWithoutTracesInput, TaskUncheckedUpdateWithoutTracesInput>
  }

  export type TaskUpdateWithoutTracesInput = {
    appId?: StringFieldUpdateOperationsInput | string
    os?: StringFieldUpdateOperationsInput | string
    traceIds?: TaskUpdatetraceIdsInput | string[]
    description?: StringFieldUpdateOperationsInput | string
    Capture?: CaptureUpdateManyWithoutTaskNestedInput
  }

  export type TaskUncheckedUpdateWithoutTracesInput = {
    appId?: StringFieldUpdateOperationsInput | string
    os?: StringFieldUpdateOperationsInput | string
    traceIds?: TaskUpdatetraceIdsInput | string[]
    description?: StringFieldUpdateOperationsInput | string
    Capture?: CaptureUncheckedUpdateManyWithoutTaskNestedInput
  }

  export type TraceCreateWithoutTaskInput = {
    id?: string
    v?: number
    appId: string
    created?: Date | string
    name?: string | null
    description: string
    screenIds?: TraceCreatescreenIdsInput | string[]
    worker: string
    screens?: ScreenCreateNestedManyWithoutTraceInput
  }

  export type TraceUncheckedCreateWithoutTaskInput = {
    id?: string
    v?: number
    appId: string
    created?: Date | string
    name?: string | null
    description: string
    screenIds?: TraceCreatescreenIdsInput | string[]
    worker: string
    screens?: ScreenUncheckedCreateNestedManyWithoutTraceInput
  }

  export type TraceCreateOrConnectWithoutTaskInput = {
    where: TraceWhereUniqueInput
    create: XOR<TraceCreateWithoutTaskInput, TraceUncheckedCreateWithoutTaskInput>
  }

  export type TraceCreateManyTaskInputEnvelope = {
    data: TraceCreateManyTaskInput | TraceCreateManyTaskInput[]
  }

  export type CaptureCreateWithoutTaskInput = {
    id?: string
    appId: string
    otp: string
    src: string
    app?: AppCreateNestedOneWithoutCaptureInput
  }

  export type CaptureUncheckedCreateWithoutTaskInput = {
    id?: string
    appId_?: string | null
    appId: string
    otp: string
    src: string
  }

  export type CaptureCreateOrConnectWithoutTaskInput = {
    where: CaptureWhereUniqueInput
    create: XOR<CaptureCreateWithoutTaskInput, CaptureUncheckedCreateWithoutTaskInput>
  }

  export type CaptureCreateManyTaskInputEnvelope = {
    data: CaptureCreateManyTaskInput | CaptureCreateManyTaskInput[]
  }

  export type TraceUpsertWithWhereUniqueWithoutTaskInput = {
    where: TraceWhereUniqueInput
    update: XOR<TraceUpdateWithoutTaskInput, TraceUncheckedUpdateWithoutTaskInput>
    create: XOR<TraceCreateWithoutTaskInput, TraceUncheckedCreateWithoutTaskInput>
  }

  export type TraceUpdateWithWhereUniqueWithoutTaskInput = {
    where: TraceWhereUniqueInput
    data: XOR<TraceUpdateWithoutTaskInput, TraceUncheckedUpdateWithoutTaskInput>
  }

  export type TraceUpdateManyWithWhereWithoutTaskInput = {
    where: TraceScalarWhereInput
    data: XOR<TraceUpdateManyMutationInput, TraceUncheckedUpdateManyWithoutTaskInput>
  }

  export type TraceScalarWhereInput = {
    AND?: TraceScalarWhereInput | TraceScalarWhereInput[]
    OR?: TraceScalarWhereInput[]
    NOT?: TraceScalarWhereInput | TraceScalarWhereInput[]
    id?: StringFilter<"Trace"> | string
    v?: IntFilter<"Trace"> | number
    appId?: StringFilter<"Trace"> | string
    created?: DateTimeFilter<"Trace"> | Date | string
    name?: StringNullableFilter<"Trace"> | string | null
    description?: StringFilter<"Trace"> | string
    screenIds?: StringNullableListFilter<"Trace">
    taskId?: StringNullableFilter<"Trace"> | string | null
    worker?: StringFilter<"Trace"> | string
  }

  export type CaptureUpsertWithWhereUniqueWithoutTaskInput = {
    where: CaptureWhereUniqueInput
    update: XOR<CaptureUpdateWithoutTaskInput, CaptureUncheckedUpdateWithoutTaskInput>
    create: XOR<CaptureCreateWithoutTaskInput, CaptureUncheckedCreateWithoutTaskInput>
  }

  export type CaptureUpdateWithWhereUniqueWithoutTaskInput = {
    where: CaptureWhereUniqueInput
    data: XOR<CaptureUpdateWithoutTaskInput, CaptureUncheckedUpdateWithoutTaskInput>
  }

  export type CaptureUpdateManyWithWhereWithoutTaskInput = {
    where: CaptureScalarWhereInput
    data: XOR<CaptureUpdateManyMutationInput, CaptureUncheckedUpdateManyWithoutTaskInput>
  }

  export type AppCreateWithoutCaptureInput = {
    id?: string
    v?: number | null
    category?: XOR<AppsCategoryNullableCreateEnvelopeInput, AppsCategoryCreateInput> | null
    packageName: string
    metadata: XOR<AppMetadataCreateEnvelopeInput, AppMetadataCreateInput>
  }

  export type AppUncheckedCreateWithoutCaptureInput = {
    id?: string
    v?: number | null
    category?: XOR<AppsCategoryNullableCreateEnvelopeInput, AppsCategoryCreateInput> | null
    packageName: string
    metadata: XOR<AppMetadataCreateEnvelopeInput, AppMetadataCreateInput>
  }

  export type AppCreateOrConnectWithoutCaptureInput = {
    where: AppWhereUniqueInput
    create: XOR<AppCreateWithoutCaptureInput, AppUncheckedCreateWithoutCaptureInput>
  }

  export type TaskCreateWithoutCaptureInput = {
    id?: string
    appId: string
    os: string
    traceIds?: TaskCreatetraceIdsInput | string[]
    description: string
    traces?: TraceCreateNestedManyWithoutTaskInput
  }

  export type TaskUncheckedCreateWithoutCaptureInput = {
    id?: string
    appId: string
    os: string
    traceIds?: TaskCreatetraceIdsInput | string[]
    description: string
    traces?: TraceUncheckedCreateNestedManyWithoutTaskInput
  }

  export type TaskCreateOrConnectWithoutCaptureInput = {
    where: TaskWhereUniqueInput
    create: XOR<TaskCreateWithoutCaptureInput, TaskUncheckedCreateWithoutCaptureInput>
  }

  export type AppUpsertWithoutCaptureInput = {
    update: XOR<AppUpdateWithoutCaptureInput, AppUncheckedUpdateWithoutCaptureInput>
    create: XOR<AppCreateWithoutCaptureInput, AppUncheckedCreateWithoutCaptureInput>
    where?: AppWhereInput
  }

  export type AppUpdateToOneWithWhereWithoutCaptureInput = {
    where?: AppWhereInput
    data: XOR<AppUpdateWithoutCaptureInput, AppUncheckedUpdateWithoutCaptureInput>
  }

  export type AppUpdateWithoutCaptureInput = {
    v?: NullableIntFieldUpdateOperationsInput | number | null
    category?: XOR<AppsCategoryNullableUpdateEnvelopeInput, AppsCategoryCreateInput> | null
    packageName?: StringFieldUpdateOperationsInput | string
    metadata?: XOR<AppMetadataUpdateEnvelopeInput, AppMetadataCreateInput>
  }

  export type AppUncheckedUpdateWithoutCaptureInput = {
    v?: NullableIntFieldUpdateOperationsInput | number | null
    category?: XOR<AppsCategoryNullableUpdateEnvelopeInput, AppsCategoryCreateInput> | null
    packageName?: StringFieldUpdateOperationsInput | string
    metadata?: XOR<AppMetadataUpdateEnvelopeInput, AppMetadataCreateInput>
  }

  export type TaskUpsertWithoutCaptureInput = {
    update: XOR<TaskUpdateWithoutCaptureInput, TaskUncheckedUpdateWithoutCaptureInput>
    create: XOR<TaskCreateWithoutCaptureInput, TaskUncheckedCreateWithoutCaptureInput>
    where?: TaskWhereInput
  }

  export type TaskUpdateToOneWithWhereWithoutCaptureInput = {
    where?: TaskWhereInput
    data: XOR<TaskUpdateWithoutCaptureInput, TaskUncheckedUpdateWithoutCaptureInput>
  }

  export type TaskUpdateWithoutCaptureInput = {
    appId?: StringFieldUpdateOperationsInput | string
    os?: StringFieldUpdateOperationsInput | string
    traceIds?: TaskUpdatetraceIdsInput | string[]
    description?: StringFieldUpdateOperationsInput | string
    traces?: TraceUpdateManyWithoutTaskNestedInput
  }

  export type TaskUncheckedUpdateWithoutCaptureInput = {
    appId?: StringFieldUpdateOperationsInput | string
    os?: StringFieldUpdateOperationsInput | string
    traceIds?: TaskUpdatetraceIdsInput | string[]
    description?: StringFieldUpdateOperationsInput | string
    traces?: TraceUncheckedUpdateManyWithoutTaskNestedInput
  }

  export type FloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type FloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
    isSet?: boolean
  }

  export type CaptureCreateManyAppInput = {
    id?: string
    appId: string
    taskId: string
    otp: string
    src: string
  }

  export type AppsCategoryUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
  }

  export type FloatFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableFloatFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
    unset?: boolean
  }

  export type AppMetadataUpdategenreInput = {
    set?: string[]
    push?: string | string[]
  }

  export type CaptureUpdateWithoutAppInput = {
    appId?: StringFieldUpdateOperationsInput | string
    otp?: StringFieldUpdateOperationsInput | string
    src?: StringFieldUpdateOperationsInput | string
    task?: TaskUpdateOneRequiredWithoutCaptureNestedInput
  }

  export type CaptureUncheckedUpdateWithoutAppInput = {
    appId?: StringFieldUpdateOperationsInput | string
    taskId?: StringFieldUpdateOperationsInput | string
    otp?: StringFieldUpdateOperationsInput | string
    src?: StringFieldUpdateOperationsInput | string
  }

  export type CaptureUncheckedUpdateManyWithoutAppInput = {
    appId?: StringFieldUpdateOperationsInput | string
    taskId?: StringFieldUpdateOperationsInput | string
    otp?: StringFieldUpdateOperationsInput | string
    src?: StringFieldUpdateOperationsInput | string
  }

  export type ScreenCreateManyTraceInput = {
    id?: string
    v?: number
    created?: Date | string
    gesture: XOR<ScreenGestureCreateEnvelopeInput, ScreenGestureCreateInput>
    src: string
    vh: string
  }

  export type ScreenUpdateWithoutTraceInput = {
    v?: IntFieldUpdateOperationsInput | number
    created?: DateTimeFieldUpdateOperationsInput | Date | string
    gesture?: XOR<ScreenGestureUpdateEnvelopeInput, ScreenGestureCreateInput>
    src?: StringFieldUpdateOperationsInput | string
    vh?: StringFieldUpdateOperationsInput | string
  }

  export type ScreenUncheckedUpdateWithoutTraceInput = {
    v?: IntFieldUpdateOperationsInput | number
    created?: DateTimeFieldUpdateOperationsInput | Date | string
    gesture?: XOR<ScreenGestureUpdateEnvelopeInput, ScreenGestureCreateInput>
    src?: StringFieldUpdateOperationsInput | string
    vh?: StringFieldUpdateOperationsInput | string
  }

  export type ScreenUncheckedUpdateManyWithoutTraceInput = {
    v?: IntFieldUpdateOperationsInput | number
    created?: DateTimeFieldUpdateOperationsInput | Date | string
    gesture?: XOR<ScreenGestureUpdateEnvelopeInput, ScreenGestureCreateInput>
    src?: StringFieldUpdateOperationsInput | string
    vh?: StringFieldUpdateOperationsInput | string
  }

  export type TraceCreateManyTaskInput = {
    id?: string
    v?: number
    appId: string
    created?: Date | string
    name?: string | null
    description: string
    screenIds?: TraceCreatescreenIdsInput | string[]
    worker: string
  }

  export type CaptureCreateManyTaskInput = {
    id?: string
    appId_?: string | null
    appId: string
    otp: string
    src: string
  }

  export type TraceUpdateWithoutTaskInput = {
    v?: IntFieldUpdateOperationsInput | number
    appId?: StringFieldUpdateOperationsInput | string
    created?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    screenIds?: TraceUpdatescreenIdsInput | string[]
    worker?: StringFieldUpdateOperationsInput | string
    screens?: ScreenUpdateManyWithoutTraceNestedInput
  }

  export type TraceUncheckedUpdateWithoutTaskInput = {
    v?: IntFieldUpdateOperationsInput | number
    appId?: StringFieldUpdateOperationsInput | string
    created?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    screenIds?: TraceUpdatescreenIdsInput | string[]
    worker?: StringFieldUpdateOperationsInput | string
    screens?: ScreenUncheckedUpdateManyWithoutTraceNestedInput
  }

  export type TraceUncheckedUpdateManyWithoutTaskInput = {
    v?: IntFieldUpdateOperationsInput | number
    appId?: StringFieldUpdateOperationsInput | string
    created?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    screenIds?: TraceUpdatescreenIdsInput | string[]
    worker?: StringFieldUpdateOperationsInput | string
  }

  export type CaptureUpdateWithoutTaskInput = {
    appId?: StringFieldUpdateOperationsInput | string
    otp?: StringFieldUpdateOperationsInput | string
    src?: StringFieldUpdateOperationsInput | string
    app?: AppUpdateOneWithoutCaptureNestedInput
  }

  export type CaptureUncheckedUpdateWithoutTaskInput = {
    appId_?: NullableStringFieldUpdateOperationsInput | string | null
    appId?: StringFieldUpdateOperationsInput | string
    otp?: StringFieldUpdateOperationsInput | string
    src?: StringFieldUpdateOperationsInput | string
  }

  export type CaptureUncheckedUpdateManyWithoutTaskInput = {
    appId_?: NullableStringFieldUpdateOperationsInput | string | null
    appId?: StringFieldUpdateOperationsInput | string
    otp?: StringFieldUpdateOperationsInput | string
    src?: StringFieldUpdateOperationsInput | string
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