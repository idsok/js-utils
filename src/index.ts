import * as fs from 'fs'
import * as fsPath from 'path'
import * as _ from 'underscore'

export class FileSystem {
    public static exists(path: string) {
        return fs.existsSync(path);
    }
    public static create(path: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            fs.open(path, "w", (err, fd) => {
                if (!err) {
                    fs.close(fd);
                    resolve(true);
                }
                else
                    reject(false);
            });
        });
    }
    public static write(path: string, data: any, flags?: any): void {
        (async () => {
            try {
                if (!FileSystem.exists(path))
                    await FileSystem.create(path);
                fs.writeFile(path, data, "utf8");
            }
            catch (err) { console.log(err) }
        })();
    }
    public static read(path: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            fs.readFile(path, "utf8", function (err, data: any) {
                if (err) return reject(err);
                resolve(data)
            });
        });
    }
    public static readJson(path: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            FileSystem.read(path).then(data => {
                resolve(JSON.parse(data));
            }).catch(err => {
                reject(err);
            });
        });
    }
    public static readJsons(paths: string[]): Promise<any> {
        let promises = [];
        paths.forEach((path) => {
            promises.push(FileSystem.readJson(path));
        });
        return Promise.all(promises);
    }
    public static readPathsByRep(repPath: string, fileType: string): Promise<any> {
        let list = [];
        return new Promise<any>((resolve, reject) => {
            fs.readdir(repPath, (errr, files) => {
                if (errr) return reject(errr);
                let pending = files.length;
                files.forEach((f) => {
                    let path = fsPath.join(repPath, f);
                    fs.lstat(path, async (errl, stats) => {
                        if (errl) return reject(errl);
                        if (stats.isDirectory()) {
                            let paths = await FileSystem.readPathsByRep(path, fileType);
                            list = list.concat(paths);
                        }
                        else if (stats.isFile()) {
                            let regex = new RegExp('.' + fileType + '$', 'i');
                            if (regex.test(path))
                                list.push(path);
                        }
                        pending -= 1;
                        if (!pending) resolve(list);
                    });
                });
            });
        });
    }
    public static pathJoin(path1, path2): string {
        return fsPath.join(path1, path2);
    }
    public static pathAbsolute(path: string): string {
        return fsPath.normalize(path);
    }
    public static pathBasename(path: string, ext?: string): string {
        return fsPath.posix.basename(path, ext);
    }
    public static pathDirname(path: string): string {
        return path ? fsPath.dirname(path) : "";
    }
    public static pathExtname(path: string): string {
        return fsPath.extname(path);
    }
}

export class DataList {
    public static push(liste: any, data: any): void {
        liste.push(data);
    }
    public static get(liste: any, id: any, primaryKey?: string): any {
        let value = null;
        liste.every(function (item) {
            let ok = false;
            if (typeof id === "object") {
                ok = true;
                Object.keys(id).every(k => {
                    if (item[k] != id[k]) {
                        ok = false;
                        return false;
                    }
                    return true;
                });
            }
            else {
                if ((primaryKey && item[primaryKey] == id) || (!primaryKey && item == id))
                    ok = true;
            }
            if (ok) {
                value = item;
                return false;
            }
            return true;
        });
        return value;
    }
    public static index(liste: any, id: any, primaryKey?: string): number {
        let value = -1;
        liste.every(function (item, index) {
            let ok = false;
            if (typeof id === "object") {
                ok = true;
                Object.keys(id).every(k => {
                    if (item[k] != id[k]) {
                        ok = false;
                        return false;
                    }
                    return true;
                });
            }
            else {
                if ((primaryKey && item[primaryKey] == id) || (!primaryKey && item == id))
                    ok = true;
            }
            if (ok) {
                value = index;
                return false;
            }
            return true;
        });
        return value;
    }
    public static remove(liste: any, id: any, primaryKey?: string): void {
        let index = DataList.index(liste, id, primaryKey);
        if (index > -1) liste.splice(index, 1);
    }
}

export class DataTree {
    public static extend(destination: any, source: any): any {
        return _.extend(destination, source);
    }
    public static clone(source: any): any {
        return _.clone(source);
    }
    public static forEach(tree: any, action: Function) {
        let continu = true;
        if (!tree || !action) {
            return;
        }
        else if (Array.isArray(tree)) {
            tree.every(t => {
                DataTree.forEach(t, (d) => {
                    return continu = action(d);
                });
                if (continu == false) return false;
                return true;
            });
        }
        else if (typeof tree == "object") {
            Object.keys(tree).every(key => {
                let property = tree[key];
                continu = action(property);
                if (continu == false) return false;
                DataTree.forEach(property, action);
                return true;
            });
        }
    }
}

export class Logger {
    static debugLevel = "error";
    public static log(message: any, level?: string): void {
        let levels = ['error', 'warn', 'info'];
        level = level || "error";
        if (levels.indexOf(level) >= levels.indexOf(Logger.debugLevel)) {
            if (message instanceof Error) {
                message.name = "";
                message = message.message;
            }
            console.log(level + " : " + message);
        }
    }
}