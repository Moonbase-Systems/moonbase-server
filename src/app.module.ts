import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DevtoolsModule } from '@nestjs/devtools-integration';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';

import configuration, { AppConfig, LoggerConfig, LoggerFormat } from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    DevtoolsModule.register({
      http: process.env.NODE_ENV !== 'production',
    }),
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => {
        const loggerConfig = config.get<LoggerConfig>('logger');

        return {
          pinoHttp: {
            level: loggerConfig.level,
            transport: loggerConfig.format === LoggerFormat.Pretty ? { target: 'pino-pretty' } : undefined,
            useLevelLabels: true,
            formatters: {
              level: (label: string) => {
                return { level: label };
              },
            },
            autoLogging: false,
          },
        };
      },
    }),
    DatabaseModule,

    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
    HealthModule,
    AuthModule,
    UsersModule,
    AdminModule,
  ],
  providers: [Logger],
})
export class AppModule {}
