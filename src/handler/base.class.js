"use strict";
class Handler {
    constructor(key, handle) {
        this.key = key;
        this.handle = handle;
    }
    static fromCback(key, cback) {
        return new Handler(key, (obj) => {
            return new Promise((resolve, reject) => {
                try {
                    cback(obj, (err, res) => {
                        if (err) {
                            return reject(err);
                        }
                        return resolve(res);
                    });
                }
                catch (e) {
                    reject(e);
                }
            });
        });
    }
}
exports.Handler = Handler;
//# sourceMappingURL=base.class.js.map