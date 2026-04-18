export const generateInvoiceHTML = (invoice: any) => {
    return `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Helvetica', sans-serif; padding: 20px; color: #333; }
          .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .title { font-size: 32px; font-weight: bold; color: #2563EB; }
          .company-info { text-align: right; }
          .meta { margin-bottom: 30px; }
          .meta-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { text-align: left; padding: 10px; border-bottom: 2px solid #ddd; color: #666; }
          td { padding: 10px; border-bottom: 1px solid #eee; }
          .total { text-align: right; font-size: 20px; font-weight: bold; margin-top: 20px; }
          .status { 
            display: inline-block; padding: 5px 10px; border-radius: 4px; font-weight: bold;
            font-size: 14px; margin-bottom: 20px;
          }
          .paid { background: #DCFCE7; color: #166534; }
          .sent { background: #DBEAFE; color: #1E40AF; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">INVOICE</div>
            <div class="status ${invoice.status === 'PAID' ? 'paid' : 'sent'}">${invoice.status}</div>
          </div>
          <div class="company-info">
             <p><strong>Export Corp</strong></p>
             <p>123 Business Rd</p>
             <p>Abidjan, CI</p>
          </div>
        </div>

        <div class="meta">
            <div class="meta-row">
                <strong>Bill To:</strong>
                <span>${invoice.client_name}</span>
            </div>
            <div class="meta-row">
                <strong>Invoice ID:</strong>
                <span>#${invoice.id}</span>
            </div>
            <div class="meta-row">
                <strong>Date:</strong>
                <span>${invoice.date}</span>
            </div>
            <div class="meta-row">
                <strong>Due Date:</strong>
                <span>${invoice.due_date}</span>
            </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="width: 80px">Qty</th>
              <th style="width: 100px">Unit Price</th>
              <th style="width: 100px; text-align: right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map((item: any) => `
              <tr>
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>$${item.unit_price}</td>
                <td style="text-align: right">$${item.amount}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total">
          Total: $${invoice.total_amount}
        </div>
      </body>
    </html>
    `;
};
