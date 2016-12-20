declare function handleDefinition<T,R extends T>(obj: T): Promise<R>;
export class Handler<T,R extends T> {

  constructor(public key: string, public handle: typeof handleDefinition) {
  }

  static fromCback<T, R extends T>(key: string, cback: (obj: T, c: (err: Error, res: R) => void) => void): Handler<T,R> {
    return new Handler(key, (obj: T) => {
      return new Promise((resolve, reject) => {
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
      })
    });
  }

}