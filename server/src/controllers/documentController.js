import DocumentService from '../services/documentService.js';

export class DocumentController {
  /**
   * GET /api/admin/documents
   */
  static async listDocuments(req, res, next) {
    try {
      const documents = await DocumentService.listDocuments(req.query);
      res.status(200).json({
        success: true,
        count: documents.length,
        data: documents
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/documents
   */
  static async uploadDocument(req, res, next) {
    try {
      const file = req.file;
      const { topicCategory } = req.body;
      const doc = await DocumentService.uploadDocument({
        file,
        topicCategory,
        userId: req.user._id
      });

      res.status(201).json({
        success: true,
        message: 'Document uploaded and queued for indexing',
        data: doc
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/documents/:id/reindex
   */
  static async reindexDocument(req, res, next) {
    try {
      const doc = await DocumentService.reindexDocument(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Re-indexing job queued',
        data: doc
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/admin/documents/:id
   */
  static async deleteDocument(req, res, next) {
    try {
      const result = await DocumentService.deleteDocument(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Document and all its vector chunks successfully deleted',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

export default DocumentController;
