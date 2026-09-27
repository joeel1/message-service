import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator'

export class CreateMessageDto {
  
  @IsString()
  @IsNotEmpty()
  conversationId!: string

  @IsString()
  @IsNotEmpty()
  senderId!: string

  @IsString()
  @IsNotEmpty()
  content!: string

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>
}