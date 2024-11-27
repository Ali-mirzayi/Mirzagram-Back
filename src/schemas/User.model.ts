import { prop, getModelForClass, Ref } from '@typegoose/typegoose';  

class User {  
  @prop({ required: true })  
  public uuid: string;  

  @prop({ required: true })  
  public name: string;  

  @prop()  
  public avatar?: string;  

  @prop()  
  public token?: string;  
}  

export const UserModel = getModelForClass(User);  