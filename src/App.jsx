/* eslint-disable no-unused-vars */
import './App.css';
import axios from 'axios';
import { saveAs } from 'file-saver';
import JSZip, { file } from 'jszip';
import moment from 'moment';
import { useState } from 'react';
const jsZip = new JSZip();

// function pause(msec) {
//   return new Promise((resolve, reject) => {
//     setTimeout(resolve, msec || 1000);
//   });
// }

function App() {
  const [date1, setDate1] = useState();
  const [date2, setDate2] = useState();
  const [token, setToken] = useState();
  const [filter, setFilter] = useState(5);

  const handleOnclick = async () => {
    const { data } = await axios.get(
      `https://hoadondientu.gdt.gov.vn:30000/query/invoices/purchase?sort=tdlap:desc,khmshdon:asc,shdon:desc&size=50&search=tdlap=ge=${date1}T00:00:00;tdlap=le=${date2}T23:59:59;ttxly==${filter}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Access-Control-Allow-Origin': '*',
          Accept: 'application/json, text/plain, */*',
        },
      }
    );

    const arr = [];
    let newData = data?.datas;

    if (data?.state) {
      const { data: subData } = await axios.get(
        `https://hoadondientu.gdt.gov.vn:30000/query/invoices/purchase?sort=tdlap:desc,khmshdon:asc,shdon:desc&size=50&state=${data?.state}&search=tdlap=ge=${date1}T00:00:00;tdlap=le=${date2}T23:59:59;ttxly==${filter}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Access-Control-Allow-Origin': '*',
            Accept: 'application/json, text/plain, */*',
          },
        }
      );
      newData = data?.datas?.concat(subData?.datas);
    }

    if (newData) {
      for (let index = 0; index < newData.length; index++) {
        const item = newData[index];
        await axios
          .get(
            `https://hoadondientu.gdt.gov.vn:30000/query/invoices/export-xml?nbmst=${item?.nbmst}&khhdon=${item?.khhdon}&shdon=${item?.shdon}&khmshdon=${item?.khmshdon}`,
            {
              headers: {
                'Access-Control-Allow-Origin': '*',
                Authorization: `Bearer ${token}`,
                Accept: 'application/json, text/plain, */*',
                Action: 'ket-xuat-xml',
                'User-Agent':
                  'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15',
              },
              responseType: 'blob',
            }
          )
          .then((r) => ({ name: item?.shdon, result: r }))
          .then(async (item) => {
            console.log('item?.result?.data', item?.result?.data);
            jsZip.loadAsync(item?.result?.data).then(function (zip) {
              Object.keys(zip.files).forEach(async function (filename) {
                if (filename === 'invoice.xml') {
                  await zip.files[filename]
                    .async('blob')
                    .then(async function (fileData) {
                      console.log('item', item.name);
                      await saveAs(fileData, `${item?.name}.xml`);
                    });
                }
              });
            });
          })
          .catch((err) => console.log('err', err));
      }
    }
  };

  return (
    <>
      <input onChange={(e) => setToken(e?.target?.value)} />

      <div>
        <input
          type="date"
          onChange={(e) =>
            setDate1(moment(e?.target?.value).format('DD/MM/YYYY'))
          }
        ></input>
        <input
          type="date"
          onChange={(e) =>
            setDate2(moment(e?.target?.value).format('DD/MM/YYYY'))
          }
        ></input>
      </div>

      <div>{date1}</div>
      <div>{date2}</div>
      <div>
        {' '}
        <select
          style={{ width: '200px' }}
          onChange={(e) => setFilter(e?.target?.value)}
          value={filter}
        >
          <option value={5}>Đã cấp mã hóa đơn</option>
          <option value={6}>Tổng cục thuế đã nhận không mã</option>
          <option value={8}>Tông cục thế đã nhận hóa đơn có mã</option>
        </select>
      </div>

      <button onClick={handleOnclick}>Tải xuống</button>
    </>
  );
}

export default App;
