package org.apache.myfaces.tobago.renderkit.html.scarborough.standard.tag;

/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 * Created 07.02.2003 16:00:00.
 * $Id$
 */

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.myfaces.tobago.component.Attributes;
import org.apache.myfaces.tobago.renderkit.MessageRendererBase;
import org.apache.myfaces.tobago.renderkit.html.HtmlAttributes;
import org.apache.myfaces.tobago.renderkit.html.HtmlConstants;
import org.apache.myfaces.tobago.renderkit.html.util.HtmlRendererUtil;
import org.apache.myfaces.tobago.util.ComponentUtils;
import org.apache.myfaces.tobago.webapp.TobagoResponseWriter;

import javax.faces.application.FacesMessage;
import javax.faces.component.UIComponent;
import javax.faces.component.UIMessage;
import javax.faces.context.FacesContext;
import java.io.IOException;
import java.util.Iterator;

/**
 * @deprecated Please use MessagesRenderer with maxNumber="1"
 */
@Deprecated
public class MessageRenderer extends MessageRendererBase {

  private static final Log LOG = LogFactory.getLog(MessageRenderer.class);

  public void encodeEnd(FacesContext facesContext,
      UIComponent uiComponent) throws IOException {


    // FIXME: must be refactored! Bitte daran denken die msie version auch umzubauen!!!

    UIMessage component = (UIMessage) uiComponent;

    String clientId = ComponentUtils.findClientIdFor(component, facesContext);

    Iterator iterator = facesContext.getMessages(clientId);

    TobagoResponseWriter writer = HtmlRendererUtil.getTobagoResponseWriter(facesContext);

    boolean showSummary = ComponentUtils.getBooleanAttribute(component, Attributes.SHOW_SUMMARY);
    boolean showDetail = ComponentUtils.getBooleanAttribute(component, Attributes.SHOW_DETAIL);

    writer.startElement(HtmlConstants.SPAN, component);
    writer.writeClassAttribute("tobago-validation-message");
    writer.writeStyleAttribute();

    while (iterator.hasNext()) {
      FacesMessage message = (FacesMessage) iterator.next();
//      MessageFormat detail = new MessageFormat(formatString, tobagoContext.getLocale());

      String summary = message.getSummary();
      String detail = message.getDetail();

      writer.startElement(HtmlConstants.LABEL, null);
      writer.writeAttribute(HtmlAttributes.FOR, clientId, false);
      writer.writeAttribute(HtmlAttributes.TITLE, detail, true);
      boolean writeEmptyText = true;
      if (summary != null && showSummary) {
        writer.writeText(summary);
        writeEmptyText = false;
        if (detail != null && showDetail) {
          writer.writeText(" ");
        }
      }
      if (detail != null && showDetail) {
        writer.writeText(detail);
        writeEmptyText = false;
      }
      if (writeEmptyText) {
        writer.writeText("");
      }
      writer.endElement(HtmlConstants.LABEL);

      writer.startElement(HtmlConstants.BR, null);
      writer.endElement(HtmlConstants.BR);
    }
    writer.endElement(HtmlConstants.SPAN);

  }
}

