import { ROOT_DIR } from 'core/env';
import { BaseMulterInterceptor } from 'core/modules/document/interceptor/multer.interceptor';
import { MulterUploader } from 'core/modules/document/multer.handler';

export class ResumePdfInterceptor extends BaseMulterInterceptor {
    constructor() {
        super(new MulterUploader(
            ['.pdf'],
            'resume_file',
            1,
            `${ROOT_DIR}/core/uploads/interviews`
        ));
    }
}
