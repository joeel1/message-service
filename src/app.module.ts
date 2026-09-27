import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'

import configuration from './config/configuration'
import { MessagesModule } from './messages/messages.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    MongooseModule.forRootAsync({
      imports:    [ ConfigModule ],
      useFactory: (configService: ConfigService) => ({ uri: configService.getOrThrow<string>( 'mongodb.uri' ) }),
      inject:     [ ConfigService ],
    }),

    MessagesModule,
  ],
})
export class AppModule {}