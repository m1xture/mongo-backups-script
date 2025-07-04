import fs from "node:fs";
import path from "path";
import * as tar from "tar";
import { customAlphabet } from "nanoid";
import { fileURLToPath } from "url";
import dbConnect from "./dbConnect.js";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 5);

// const spliceDateString = (date): string => {
//   const
// };

class BackupsManager {
  private __filename = fileURLToPath(import.meta.url);
  private __dirname = path.dirname(this.__filename);
  // private expiresAfter = 1000 * 60 * 60 * 24 * 90; //! 90 days
  private expiresAfter = 1000 * 60 * 60 * 20; //* 2 hours (for test)
  private clearEmptyFolders(
    dir = path.join(this.__dirname, "../../backups"),
  ): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    if (entries.length === 0) {
      fs.rmdirSync(dir);
      console.log(`Deleting this one (${dir}) cause it is empty`);
      return;
    }
    entries.forEach((entry) => {
      const entryPath = path.join(entry.parentPath, entry.name);
      if (fs.statSync(entryPath).isDirectory()) {
        this.clearEmptyFolders(entryPath);
      }
    });
  }
  private deleteOldBackups(): void {
    const cb = (dir): void => {
      // const p = path.join(this.__dirname, dir);
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      if (entries.length === 0) return;
      const hasFile = entries.every((entry) => entry.isFile());
      // const hasSubfolers = entries.every((entry) => entry.isDirectory());
      // console.log("It has file - ", hasFile);
      // console.log("It has subdir - ", hasSubfolers);
      if (hasFile) {
        //? checking all data (date)

        const fileDate: number[] = dir
          .slice(dir.indexOf("backups/") + "backups/".length, dir.length)
          .split("/")
          .map((str) => Number(str));
        fileDate[1] -= 1;
        const date = new Date(...(fileDate as []));
        console.log(new Date(Date.now()));
        console.log(date);
        const diff: number = Date.now() - date.getTime();
        if (diff >= this.expiresAfter) {
          console.log(
            `This backup is too old for us. We don't need it anymore. \n Goodbye, ${entries[0].name}. Rest in peace`,
          );
          fs.unlinkSync(path.join(entries[0].parentPath, entries[0].name)); //! deleting old backups
        }
        return;
      } else {
        //? deeper
        entries.forEach((entry) => cb(entry.parentPath + "/" + entry.name));
      }
    };
    cb(path.join(this.__dirname, "../../backups"));
    // console.log(fs.readdirSync(path.join(this.__dirname, "../../backups")));
  }
  private createBackups(data: object) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const backupsDir: string = path.join(__dirname, "../../backups");
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir);
    }
    const date = new Date();
    const dateDir = path.join(
      backupsDir,
      date.getFullYear().toString(),
      (date.getMonth() + 1).toString(),
      date.getDate().toString(),
      date.getHours().toString(),
      date.getMinutes().toString(), //! AHTUNG REMOVE THIS LATER
    );
    if (!fs.existsSync(dateDir)) {
      fs.mkdirSync(dateDir, { recursive: true });
    }
    if (!fs.readdirSync(dateDir)) {
      console.log(
        `Backup in ${dateDir} directory is already created. Conflict!`,
      );
      return;
    }
    if (Object.values(data)[0].length === 0) {
      console.log("wawawawa");
      return;
    }
    // const jsonFilePath = path.join(dateDir, `${date.getMinutes()}.json`);
    Object.keys(data).forEach((key: string): void => {
      if (data[key].length === 0) {
        console.log(`Empty collection ${key}!`);
        return;
      }
      fs.writeFileSync(
        path.join(dateDir, `${key}.json`),
        JSON.stringify(data[key], null, 2),
      );
    });
    const filenames = Object.keys(data)
      .filter((key) => data[key].length > 0)
      .map((key) => `${key}.json`);
    if (filenames.length === 0) {
      console.log("We have nothing to archive...");
      return;
    }
    tar
      .c(
        {
          gzip: true,
          file: path.join(dateDir, `${nanoid()}.tar.gz`),
          cwd: dateDir,
        },
        filenames,
      )
      .then(() => {
        console.log("Archived successful!📚");
        filenames.forEach((filename: string): void => {
          fs.unlinkSync(path.join(dateDir, filename));
        });
      })
      .catch((e) => {
        console.log(e);
      });
  }
  backup() {
    dbConnect().then(async (data) => {
      try {
        console.log("console 2");
        this.createBackups(data);
        this.deleteOldBackups();
        this.clearEmptyFolders();
      } catch (err) {
        console.log(err);
      }
    });
  }
}

export default new BackupsManager();
