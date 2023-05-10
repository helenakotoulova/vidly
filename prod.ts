import compression from 'compression';
import helmet from 'helmet';

export function prod(app) {
    app.use(helmet());
    app.use(compression());
}