const fs = require('fs');
const file = 'backend/src/media/media.controller.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\/\/ Attempt to physically delete the file[\s\S]*?return \{ success: true \};/m, `// Delete from DB first
    try {
      await this.mediaRepository['prisma'].media.delete({
        where: { id }
      });
    } catch (err: any) {
      if (err.code === 'P2003') {
        throw new BadRequestException('Esta mídia está em uso por outros registros (serviço, produto, etc) e não pode ser excluída.');
      }
      throw new BadRequestException('Erro ao excluir mídia. ' + (err.message || ''));
    }

    // Attempt to physically delete the file ONLY after successful DB deletion
    try {
      if (media.url) {
        // url is /uploads/filename
        const filePath = media.url.replace('/uploads/', '');
        await this.storageService.deleteFile(filePath);
      }
    } catch (err) {
      console.error('Failed to delete physical file:', err);
    }

    return { success: true };`);

fs.writeFileSync(file, content, 'utf8');
console.log('Replaced successfully');
