import { NextResponse } from 'next/server';
import Client from 'ssh2-sftp-client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { filename, items } = body;

    if (!filename || !items) {
      return NextResponse.json({ error: 'Missing filename or items array' }, { status: 400 });
    }

    // Prepare SPX JSON Rundown Format
    const rundownJson = {
      project: "Teks Otomatis",
      rundown: filename,
      show: filename,
      warning: "Modifications done in the SPX will overwrite this file.",
      copyright: "(c) 2020-2023 Softpix (https://spx.graphics)",
      updated: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      templates: items.map((item: any, index: number) => {
        const id = Date.now().toString() + index;
        
        // Extract values from the frontend's simple DataFields
        const getFieldValue = (fieldName: string, defaultValue: string = "") => {
          const field = item.DataFields.find((f: any) => f.field === fieldName);
          return field ? field.value : defaultValue;
        };

        return {
          itemID: id,
          luuid: id,
          defversion: "1",
          description: "Lyrics and Scripture",
          playserver: "OVERLAY",
          playchannel: "1",
          playlayer: "14",
          webplayout: "14",
          steps: "500",
          out: "manual",
          dataformat: "json",
          uicolor: "7",
          onair: "false",
          imported: Date.now().toString(),
          relpath: "/smartpx/faith/SPX_Faith.html",
          DataFields: [
            {
              field: "comment",
              ftype: "textfield",
              title: "Name item for rundown",
              value: getFieldValue("comment", "Item")
            },
            {
              field: "f0",
              ftype: "textfield",
              title: "Headline",
              value: getFieldValue("f0", "")
            },
            {
              ftype: "instruction",
              value: "Two empty lines splits the text into pages. Use CONTINUE (Shift + Space) to progress to subsequent pages."
            },
            {
              field: "f1",
              ftype: "textarea",
              title: "Multipage texts",
              value: getFieldValue("f1", "")
            },
            {
              field: "f2",
              ftype: "textfield",
              title: "Footer text",
              value: getFieldValue("f2", "")
            },
            {
              field: "f3",
              ftype: "filelist",
              title: "Background",
              assetfolder: "/media/images/bg/",
              extension: "png",
              value: getFieldValue("f3", "none")
            },
            {
              field: "f4",
              ftype: "dropdown",
              title: "Position on screen",
              value: getFieldValue("f4", "gfxCenter"),
              items: [
                { text: "Left", value: "gfxLeft" },
                { text: "Center", value: "gfxCenter" },
                { text: "Right", value: "gfxRight" }
              ]
            }
          ]
        };
      })
    };

    const sftp = new Client();
    const sshConfig = {
      host: process.env.SPX_SSH_HOST,
      port: parseInt(process.env.SPX_SSH_PORT || '22'),
      username: process.env.SPX_SSH_USER,
      password: process.env.SPX_SSH_PASS,
      privateKey: process.env.SPX_SSH_KEY ? process.env.SPX_SSH_KEY.replace(/\\n/g, '\n') : undefined,
    };

    if (!sshConfig.host || !sshConfig.username || (!sshConfig.privateKey && !sshConfig.password)) {
      return NextResponse.json({ error: 'Missing SSH credentials (need Key or Password) in environment variables' }, { status: 500 });
    }

    await sftp.connect(sshConfig);

    const remotePath = `/root/SPX_1_2_1_linux64/DATAROOT/Teks Otomatis/data/${filename}.json`;
    const buffer = Buffer.from(JSON.stringify(rundownJson, null, 2), 'utf-8');

    await sftp.put(buffer, remotePath);
    await sftp.end();

    return NextResponse.json({ success: true, message: 'Rundown successfully uploaded to SPX via SFTP' });

  } catch (error: any) {
    console.error('SFTP Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
