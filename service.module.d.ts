import { DynamicModule } from '@nestjs/common';
import { IServiceOptions } from './interfaces/service-options.interface';
export declare class ServiceModule {
    static register(options?: IServiceOptions): DynamicModule;
}
