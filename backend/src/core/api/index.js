import { MediaResolver } from 'core/api/media';
import { UserResolver } from 'core/api/user/user.resolver';
import { ApiDocument } from 'core/config/swagger.config';
import { HandlerResolver } from '../../packages/handler/HandlerResolver';
import { AuthResolver } from './auth/auth.resolver';
import { IndustryResolver } from './industries';
import { CandidateResolver } from './candidate';
import { JobResolver } from './job/job.resolver';
import { InterviewResolver } from './interview';

export const ModuleResolver = HandlerResolver
    .builder()
    .addSwaggerBuilder(ApiDocument)
    .addModule([
        AuthResolver,
        UserResolver,
        MediaResolver,
        IndustryResolver,
        CandidateResolver,
        JobResolver,
        InterviewResolver,
    ]);
