import Mailjet, { LibraryResponse, SendEmailV3_1 } from 'node-mailjet';
import { MAILJET_SERVICE } from '../settings';

const mailjet = Mailjet.apiConnect(MAILJET_SERVICE.MJ_APIKEY_PUBLIC, MAILJET_SERVICE.MJ_APIKEY_PRIVATE, {
  config: {},
  options: {},
});

const sendVerificationEmail = async (toEmail: string, url: string, templateId: number) => {
  const response: LibraryResponse<SendEmailV3_1.Response> = await mailjet
    .post('send', {
      version: 'v3.1',
    })
    .request({
      Messages: [
        {
          From: {
            Email: 'kurokurochi25@gmail.com',
            Name: 'Garena Nutriwell',
          },
          To: [
            {
              Email: toEmail,
            },
          ],
          TemplateErrorReporting: {
            Email: 'kurokurochi25@gmail.com',
            Name: 'Reporter',
          },
          TemplateID: templateId,
          TemplateLanguage: true,
          Variables: {
            company_email: 'kurokurochi25@gmail.com',
            name: toEmail,
            url: url,
          },
        },
      ],
    });
  const { Status } = response.body.Messages[0];
  return Status;
};

export { sendVerificationEmail };
