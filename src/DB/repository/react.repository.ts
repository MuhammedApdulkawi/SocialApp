import { IReact } from "../../common";
import { ReactModel } from "../models";
import { BaseRepository } from "./base.repository";

export class reactRepository extends BaseRepository<IReact> {
    constructor() {
        super(ReactModel);
    }
}