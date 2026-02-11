import mongoose, {
  FilterQuery,
  Model,
  ProjectionType,
  QueryOptions,
  UpdateQuery,
  MongooseUpdateQueryOptions as UpdateOptions,
} from "mongoose";

export abstract class BaseRepository<T> {
  constructor(private model: Model<T>) {}
  async createNewDocument(document: Partial<T>): Promise<T> {
    return await this.model.create(document);
  }

  async findOneDocument(
    filters: FilterQuery<T>,
    projection?: ProjectionType<T>,
    options?: QueryOptions<T>,
  ): Promise<T | null> {
    return await this.model.findOne(filters, projection, options);
  }
  async findDocumentById(
    id: mongoose.Types.ObjectId,
    projection?: ProjectionType<T>,
    options?: QueryOptions<T>,
  ): Promise<T | null> {
    return await this.model.findById(id, projection, options);
  }
  async findOneAndUpdateDocument(
    filters: FilterQuery<T>,
    update: UpdateQuery<T>,
    options?: QueryOptions<T>,
  ): Promise<T | null> {
    return await this.model.findOneAndUpdate(filters, update, options);
  }
  async findAllDocuments(
    filters: FilterQuery<T> = {},
    projection?: ProjectionType<T>,
    options?: QueryOptions<T>,
  ): Promise<T[] | []> {
    return await this.model.find(filters, projection, options);
  }

  async updateOneDocument(
    filters: FilterQuery<T>,
    update: UpdateQuery<T>,
    options?: UpdateOptions<T>,
  ) {
    return this.model.updateOne(filters, update, options);
  }
  async updateWithSave(
    filters: FilterQuery<T>,
    data: Partial<T>,
  ): Promise<T | null> {
    const doc = await this.model.findOne(filters);
    if (!doc) return null;

    Object.assign(doc, data);
    await doc.save();

    return doc;
  }

  async deleteOneDocument(
    filters: FilterQuery<T>,
  ): Promise<{ deletedCount?: number }> {
    return await this.model.deleteOne(filters);
  }

  async deleteManyDocuments(
    filters: FilterQuery<T>,
  ): Promise<{ deletedCount?: number }> {
    return await this.model.deleteMany(filters);
  }

  async deleteDocumentById(id: mongoose.Types.ObjectId) {
    return await this.model.findByIdAndDelete(id);
  }
}
