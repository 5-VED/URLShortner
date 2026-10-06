// // common/interceptors/logging.interceptor.ts
// import {
//   Injectable,
//   NestInterceptor,
//   ExecutionContext,
//   CallHandler,
//   Logger,
// } from '@nestjs/common';
// import { Observable } from 'rxjs';
// import { tap, catchError } from 'rxjs/operators';
// import { throwError } from 'rxjs';

// @Injectable()
// export class LoggingInterceptor implements NestInterceptor {
//   private readonly logger = new Logger('HTTP');

//   intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
//     // Only handle HTTP context (skip if using this in GraphQL/WS/RPC apps)
//     if (context.getType() !== 'http') {
//       return next.handle();
//     }

//     const request = context.switchToHttp().getRequest();
//     const response = context.switchToHttp().getResponse();

//     const { method, originalUrl, ip, body } = request;
//     const userAgent = request.get('user-agent') || '';
//     const now = Date.now();

//     this.logger.log(
//       `Incoming Request: ${method} ${originalUrl} - ${ip} - ${userAgent}`,
//     );

//     return next.handle().pipe(
//       tap(() => {
//         const { statusCode } = response;
//         const responseTime = Date.now() - now;

//         this.logger.log(
//           `${method} ${originalUrl} ${statusCode} - ${responseTime}ms`,
//         );
//       }),
//       catchError((error) => {
//         const responseTime = Date.now() - now;
//         const statusCode = error?.status || 500;

//         this.logger.error(
//           `${method} ${originalUrl} ${statusCode} - ${responseTime}ms - Error: ${error.message}`,
//           error.stack,
//         );

//         return throwError(() => error);
//       }),
//     );
//   }
// }
