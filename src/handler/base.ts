export class Handler<T, R extends T> {

  // tslint:disable-next-line max-line-length
  public static fromCback<T, R extends T>(key: string, cback: (obj: T, c: (err: Error, res: R) => void) => void): Handler<T, R> {
    return new Handler<T, R>(key, (obj: T) => {
      return new Promise<R>((resolve, reject) => {
        try {
          cback(obj, (err: Error, res: R) => {
            if (err) {
              return reject(err);
            }
            return resolve(res);
          });
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  constructor(public key: string, public handle: (obj: T, ...rest: any[]) => Promise<R>) {
  }

}
