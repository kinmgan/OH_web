import { StaticPageService } from '@/services/staticPage.service';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chính sách mua hàng',
};

export default async function PolicyPage() {
  let pageData = null;
  
  try {
    pageData = await StaticPageService.getPage('chinh-sach');
  } catch (error) {
    console.error('Failed to load policy page data', error);
  }

  return (
    <main className="min-h-screen bg-stone-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden">
        <div className="bg-[#A57322] px-8 py-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {pageData?.title || 'Chính Sách & Hỗ Trợ Khách Hàng'}
          </h1>
          <div className="w-24 h-1 bg-[#FACC15] mx-auto mt-6 rounded-full"></div>
        </div>
        
        <div className="p-8 md:p-12">
          {pageData?.content ? (
            <div 
              className="max-w-none text-gray-800 leading-relaxed
                         [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-[#194A33] [&_h1]:mb-4
                         [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#194A33] [&_h2]:mb-4 [&_h2]:mt-6
                         [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-[#194A33] [&_h3]:mb-3 [&_h3]:mt-5
                         [&_p]:mb-4
                         [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-4 [&_ul>li]:mb-1
                         [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-4 [&_ol>li]:mb-1
                         [&_a]:text-[#194A33] [&_a]:font-semibold hover:[&_a]:underline
                         [&_strong]:font-bold
                         [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-6
                         [&_.ql-align-center]:text-center [&_.ql-align-center_img]:inline-block
                         [&_.ql-align-right]:text-right [&_.ql-align-right_img]:inline-block
                         [&_.ql-align-justify]:text-justify"
              dangerouslySetInnerHTML={{ __html: pageData.content.replace(/&nbsp;/g, ' ') }} 
            />
          ) : (
            <div className="text-center text-gray-500 italic py-12">
              Nội dung chính sách đang được cập nhật. Vui lòng quay lại sau!
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
